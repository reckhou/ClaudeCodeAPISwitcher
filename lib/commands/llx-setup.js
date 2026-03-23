import chalk from 'chalk';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export async function setupLlx() {
  // Resolve package root from this module's location (lib/commands/ -> ../../)
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(moduleDir, '..', '..');

  const cleanConfigDir = path.join(os.homedir(), '.claude-api-only');

  // Proactively create the clean config directory
  if (!fs.existsSync(cleanConfigDir)) {
    fs.mkdirSync(cleanConfigDir, { recursive: true });
    console.log(chalk.green(`Created clean config directory: ${cleanConfigDir}`));
  } else {
    console.log(chalk.gray(`Clean config directory already exists: ${cleanConfigDir}`));
  }

  console.log('');
  console.log(chalk.cyan('llx runs Claude Code using only your API key, bypassing claude.ai session token conflicts.'));
  console.log('');
  console.log(chalk.bold('To use the llx command, add an alias to your shell profile:'));
  console.log('');

  if (process.platform === 'win32') {
    const ps1Path = path.join(packageRoot, 'bin', 'llx.ps1');
    const bashPath = path.join(packageRoot, 'bin', 'llx');

    console.log(chalk.yellow('PowerShell (add to your $PROFILE):'));
    console.log(chalk.white(`  Set-Alias -Name llx -Value "${ps1Path}"`));
    console.log('');
    console.log(chalk.yellow('Git Bash (add to your ~/.bashrc or ~/.bash_profile):'));
    console.log(chalk.white(`  alias llx='${bashPath}'`));
  } else {
    const bashPath = path.join(packageRoot, 'bin', 'llx');
    console.log(chalk.yellow('Bash/Zsh (add to your ~/.bashrc or ~/.zshrc):'));
    console.log(chalk.white(`  alias llx='${bashPath}'`));
  }

  console.log('');
  console.log(chalk.gray('After adding the alias, open a new terminal and run: llx'));
}
