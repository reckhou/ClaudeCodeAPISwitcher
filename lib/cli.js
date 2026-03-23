import { Command } from 'commander';
import chalk from 'chalk';
import { switchTo, refreshOpenRouterProfile } from './commands/switch.js';
import { showStatus } from './commands/status.js';
import { runMenu } from './commands/menu.js';
import { assignModelByFlag } from './commands/models.js';
import { setupLlx } from './commands/llx-setup.js';

export async function run() {
  const program = new Command();

  program
    .name('claude-switcher')
    .description('Switch Claude Code between Anthropic and OpenRouter APIs')
    .version('1.0.0')
    .option('--use <provider>', 'Switch to provider (anthropic or openrouter)')
    .option('--status', 'Show current mode and configuration')
    .option('--set-opus <model-id>', 'Assign OpenRouter model to Opus tier')
    .option('--set-sonnet <model-id>', 'Assign OpenRouter model to Sonnet tier')
    .option('--set-haiku <model-id>', 'Assign OpenRouter model to Haiku tier')
    .option('--setup-llx', 'Set up the llx command (API-key-only Claude Code launcher)')
    .option('--restore-model', 'Reapply the configured OpenRouter model to ~/.claude/settings.json');

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
    } else if (opts.setOpus || opts.setSonnet || opts.setHaiku) {
      if (opts.setOpus) await assignModelByFlag('opus', opts.setOpus);
      if (opts.setSonnet) await assignModelByFlag('sonnet', opts.setSonnet);
      if (opts.setHaiku) await assignModelByFlag('haiku', opts.setHaiku);
    } else if (opts.setupLlx) {
      await setupLlx();
    } else if (opts.restoreModel) {
      await refreshOpenRouterProfile();
      console.log(chalk.green('OpenRouter model restored to ~/.claude/settings.json.'));
    } else {
      await runMenu();
    }
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}
