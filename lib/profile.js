import os from 'os';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const MARKER_START = '# BEGIN claude-switcher';
const MARKER_END = '# END claude-switcher';

export function getProfilePath() {
  const platform = os.platform();

  if (platform === 'win32') {
    // Try PowerShell 7 (pwsh) first — it's the modern default on Windows 10/11.
    // Fall back to Windows PowerShell 5.1 (powershell.exe) if pwsh is not installed.
    // IMPORTANT: use single quotes around the -Command value so bash/cmd does NOT
    // expand $PROFILE before passing it to PowerShell.
    const candidates = ['pwsh', 'powershell'];
    for (const exe of candidates) {
      try {
        const profilePath = execSync(`${exe} -NoProfile -Command "Write-Output ${"$"}PROFILE"`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
        if (profilePath && profilePath.length > 0) {
          return profilePath;
        }
      } catch {
        // try next candidate
      }
    }
    // Final fallback: PowerShell 7 Documents path (most common on Windows 10/11)
    return path.join(os.homedir(), 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
  }

  const shell = process.env.SHELL || '/bin/bash';
  if (shell.includes('zsh')) {
    return path.join(os.homedir(), '.zshrc');
  }
  return path.join(os.homedir(), '.bashrc');
}

export function readProfile(profilePath) {
  try {
    return fs.readFileSync(profilePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return '';
    }
    throw err;
  }
}

export function writeProfile(profilePath, content) {
  const dir = path.dirname(profilePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(profilePath, content, 'utf8');
}

export function injectBlock(profileContent, block) {
  const re = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`, 'm');
  const newBlock = `${MARKER_START}\n${block}\n${MARKER_END}\n`;
  if (re.test(profileContent)) {
    return profileContent.replace(re, newBlock);
  }
  return profileContent + '\n' + newBlock;
}

export function removeBlock(profileContent) {
  const re = new RegExp(`\\n?${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`, 'm');
  return profileContent.replace(re, '');
}

export function buildOpenRouterBlock(apiKey, models = {}) {
  const platform = os.platform();

  if (platform === 'win32') {
    const lines = [
      `$env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api"`,
      `$env:ANTHROPIC_AUTH_TOKEN = "${apiKey}"`,
      `$env:ANTHROPIC_API_KEY = ""`,
    ];
    if (models.sonnet) lines.push(`$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "${models.sonnet}"`);
    if (models.opus)   lines.push(`$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "${models.opus}"`);
    if (models.haiku)  lines.push(`$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "${models.haiku}"`);
    return lines.join('\n');
  }

  const lines = [
    `export ANTHROPIC_BASE_URL="https://openrouter.ai/api"`,
    `export ANTHROPIC_AUTH_TOKEN="${apiKey}"`,
    `export ANTHROPIC_API_KEY=""`,
  ];
  if (models.sonnet) lines.push(`export ANTHROPIC_DEFAULT_SONNET_MODEL="${models.sonnet}"`);
  if (models.opus)   lines.push(`export ANTHROPIC_DEFAULT_OPUS_MODEL="${models.opus}"`);
  if (models.haiku)  lines.push(`export ANTHROPIC_DEFAULT_HAIKU_MODEL="${models.haiku}"`);
  return lines.join('\n');
}

export function buildAnthropicRestoreBlock(apiKey) {
  if (apiKey === null || apiKey === undefined) {
    return null;
  }

  const platform = os.platform();

  if (platform === 'win32') {
    return `$env:ANTHROPIC_API_KEY = "${apiKey}"`;
  }

  return `export ANTHROPIC_API_KEY="${apiKey}"`;
}
