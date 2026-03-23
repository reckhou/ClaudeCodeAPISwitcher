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

  // Copy llx.ps1 to fixed location for profile-based invocation
  const llxSwitcherDir = path.join(os.homedir(), '.claude-switcher');
  const llxSwitcherPs1 = path.join(llxSwitcherDir, 'llx.ps1');
  const sourcePs1 = path.join(packageRoot, 'bin', 'llx.ps1');

  if (process.platform === 'win32') {
    if (!fs.existsSync(llxSwitcherDir)) {
      fs.mkdirSync(llxSwitcherDir, { recursive: true });
    }
    if (fs.existsSync(sourcePs1)) {
      fs.copyFileSync(sourcePs1, llxSwitcherPs1);
      console.log(chalk.green(`Copied llx.ps1 to: ${llxSwitcherPs1}`));
    } else {
      console.log(chalk.yellow(`Source llx.ps1 not found at: ${sourcePs1}`));
    }
  } else {
    // For Unix, also copy the bash wrapper
    const llxSwitcherBin = path.join(llxSwitcherDir, 'bin');
    const sourceBin = path.join(packageRoot, 'bin', 'llx');
    const destBin = path.join(llxSwitcherBin, 'llx');
    if (!fs.existsSync(llxSwitcherBin)) {
      fs.mkdirSync(llxSwitcherBin, { recursive: true });
    }
    if (fs.existsSync(sourceBin)) {
      fs.copyFileSync(sourceBin, destBin);
      fs.chmodSync(destBin, '755');
      console.log(chalk.green(`Copied llx to: ${destBin}`));
    }
  }

  console.log('');
  console.log(chalk.cyan('llx setup complete. Open a new terminal for changes to take effect.'));
  console.log(chalk.dim('Tip: Re-run "llx-setup" after updating claude-switcher to pick up any changes to llx.ps1/llx.'));
}
