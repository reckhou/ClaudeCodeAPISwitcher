import os from 'os';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const MARKER_START = '# BEGIN claude-switcher';
const MARKER_END = '# END claude-switcher';

export function getProfilePath() {
  const platform = os.platform();

  if (platform === 'win32') {
    try {
      const profilePath = execSync('powershell -NoProfile -Command "echo $PROFILE"', {
        encoding: 'utf8'
      }).trim();
      return profilePath;
    } catch {
      return path.join(os.homedir(), 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
    }
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

export function buildOpenRouterBlock(apiKey) {
  const platform = os.platform();

  if (platform === 'win32') {
    return [
      `$env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api"`,
      `$env:ANTHROPIC_AUTH_TOKEN = "${apiKey}"`,
      `$env:ANTHROPIC_API_KEY = ""`
    ].join('\n');
  }

  return [
    `export ANTHROPIC_BASE_URL="https://openrouter.ai/api"`,
    `export ANTHROPIC_AUTH_TOKEN="${apiKey}"`,
    `export ANTHROPIC_API_KEY=""`
  ].join('\n');
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
