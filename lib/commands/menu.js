import chalk from 'chalk';
import * as p from '@clack/prompts';
import { getMode } from '../config.js';
import { switchTo } from './switch.js';
import { showStatus } from './status.js';
import { runModelsMenu } from './models.js';

export async function runMenu() {
  const currentMode = getMode();

  p.intro(chalk.bold('Claude Code API Switcher'));

  const action = await p.select({
    message: `Current mode: ${currentMode}. What would you like to do?`,
    options: [
      { value: 'openrouter', label: 'Switch to OpenRouter', hint: currentMode === 'openrouter' ? 'current' : undefined },
      { value: 'anthropic', label: 'Switch to Anthropic (native)', hint: currentMode === 'anthropic' ? 'current' : undefined },
      { value: 'status', label: 'Show detailed status' },
      { value: 'models', label: 'Configure models' },
      { value: 'exit', label: 'Exit' },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  switch (action) {
    case 'openrouter':
      await switchTo('openrouter');
      break;
    case 'anthropic':
      await switchTo('anthropic');
      break;
    case 'status':
      await showStatus();
      break;
    case 'models':
      await runModelsMenu();
      break;
    case 'exit':
      p.outro('Goodbye.');
      return;
  }

  p.outro('Done.');
}
