import { Command } from 'commander';
import chalk from 'chalk';
import { switchTo } from './commands/switch.js';
import { showStatus } from './commands/status.js';
import { runMenu } from './commands/menu.js';

export async function run() {
  const program = new Command();

  program
    .name('claude-switcher')
    .description('Switch Claude Code between Anthropic and OpenRouter APIs')
    .version('1.0.0')
    .option('--use <provider>', 'Switch to provider (anthropic or openrouter)')
    .option('--status', 'Show current mode and configuration');

  program.parse(process.argv);

  const opts = program.opts();

  try {
    if (opts.use) {
      const provider = opts.use.toLowerCase();
      if (provider !== 'anthropic' && provider !== 'openrouter') {
        console.error(chalk.red(`Invalid provider: "${opts.use}". Use "anthropic" or "openrouter".`));
        process.exit(1);
      }
      await switchTo(provider);
    } else if (opts.status) {
      await showStatus();
    } else {
      await runMenu();
    }
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}
