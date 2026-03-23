import chalk from 'chalk';
import { getMode, getModels } from '../config.js';
import { getProfilePath, readProfile } from '../profile.js';

export async function showStatus() {
  const mode = getMode();
  const models = getModels();
  const profilePath = getProfilePath();
  const profileContent = readProfile(profilePath);

  const profileInjected = profileContent.includes('# BEGIN claude-switcher');

  console.log('');
  console.log(chalk.bold('Claude Code API Switcher - Status'));
  console.log('');

  const modeDisplay = mode === 'openrouter'
    ? chalk.cyan(mode)
    : chalk.green(mode);

  console.log(`Mode:              ${modeDisplay}`);
  console.log(`Profile:           ${profilePath}`);
  console.log(`Profile injected:  ${profileInjected ? chalk.green('Yes') : chalk.yellow('No')}`);
  console.log('');
  console.log('Model mappings:');

  const tiers = ['opus', 'sonnet', 'haiku'];
  for (const tier of tiers) {
    const model = models[tier] || '(not set)';
    console.log(`  ${tier}: ${model}`);
  }

  console.log('');
}
