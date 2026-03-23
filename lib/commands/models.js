import * as p from '@clack/prompts';
import chalk from 'chalk';
import { getOpenRouterKey, saveOpenRouterKey } from '../keychain.js';
import { setModel, getModels, getMode } from '../config.js';
import { refreshOpenRouterProfile } from './switch.js';

/**
 * Validates that a model ID exists on OpenRouter by fetching the models list.
 * @param {string} modelId - The model ID to validate (e.g. "anthropic/claude-3-opus")
 * @param {string} apiKey - OpenRouter API key for authentication
 * @returns {Promise<boolean>} true if model exists, false otherwise
 */
export async function validateModelId(modelId, apiKey) {
  const s = p.spinner();
  s.start('Validating model ID with OpenRouter...');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      s.stop(chalk.red(`OpenRouter API error: ${res.status} ${res.statusText}`));
      return false;
    }
    const body = await res.json();
    const found = body.data.some((m) => m.id === modelId);
    if (found) {
      s.stop('Model ID is valid.');
      return true;
    } else {
      s.stop(chalk.red(`Model "${modelId}" not found in OpenRouter model list.`));
      return false;
    }
  } catch (err) {
    s.stop(chalk.red(`Network error: ${err.message}`));
    return false;
  }
}

/**
 * Interactively assigns a model to a Claude tier. Prompts for API key if not stored.
 * Prompts for model ID and validates it against OpenRouter before persisting.
 * @param {string} tier - 'opus' | 'sonnet' | 'haiku'
 * @returns {Promise<boolean>} true on success or cancel, false on validation failure (caller re-prompts)
 */
export async function assignModel(tier) {
  // Step 1: Get API key from keychain, prompt if not stored
  let apiKey = await getOpenRouterKey();
  if (!apiKey) {
    const key = await p.text({
      message: 'Enter your OpenRouter API key:',
      placeholder: 'sk-or-...',
      validate(value) {
        if (!value || value.trim().length === 0) {
          return 'API key cannot be empty.';
        }
      },
    });
    if (p.isCancel(key)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    apiKey = key.trim();
    await saveOpenRouterKey(apiKey);
  }

  // Step 2: Prompt for model ID
  const modelInput = await p.text({
    message: `Enter model ID for ${tier} tier:`,
    placeholder: 'e.g. anthropic/claude-3-opus',
    validate(value) {
      if (!value || value.trim().length === 0) {
        return 'Model ID cannot be empty.';
      }
    },
  });
  if (p.isCancel(modelInput)) {
    p.cancel('Cancelled.');
    return true; // exit gracefully, treat cancel as done
  }

  // Step 3: Validate the model ID
  const modelId = modelInput.trim();
  const valid = await validateModelId(modelId, apiKey);
  if (!valid) {
    return false; // caller will re-prompt
  }

  // Step 4: Persist the model assignment and refresh profile if on OpenRouter
  setModel(tier, modelId);
  if (getMode() === 'openrouter') {
    await refreshOpenRouterProfile();
  }
  p.log.success(chalk.green(`${tier} tier set to: ${modelId}`));
  return true;
}

/**
 * Assigns a model to a Claude tier from a CLI flag (non-interactive).
 * Validates the model ID before persisting. Exits with error code 1 if invalid.
 * @param {string} tier - 'opus' | 'sonnet' | 'haiku'
 * @param {string} modelId - The model ID to assign
 */
export async function assignModelByFlag(tier, modelId) {
  // Step 1: Get API key from keychain, prompt if not stored
  let apiKey = await getOpenRouterKey();
  if (!apiKey) {
    const key = await p.text({
      message: 'Enter your OpenRouter API key:',
      placeholder: 'sk-or-...',
      validate(value) {
        if (!value || value.trim().length === 0) {
          return 'API key cannot be empty.';
        }
      },
    });
    if (p.isCancel(key)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    apiKey = key.trim();
    await saveOpenRouterKey(apiKey);
  }

  // Step 2: Validate the model ID
  const trimmedId = modelId.trim();
  const valid = await validateModelId(trimmedId, apiKey);
  if (!valid) {
    console.error(chalk.red(`Model "${trimmedId}" not found on OpenRouter. Assignment cancelled.`));
    process.exit(1);
  }

  // Step 3: Persist the model assignment and refresh profile if on OpenRouter
  setModel(tier, trimmedId);
  if (getMode() === 'openrouter') {
    await refreshOpenRouterProfile();
  }
  console.log(chalk.green(`${tier} tier set to: ${trimmedId}`));
}

/**
 * Runs the interactive models sub-menu. Shows current model assignments for each tier
 * and lets the user select a tier to configure.
 */
export async function runModelsMenu() {
  const models = getModels();

  const tier = await p.select({
    message: 'Select a tier to configure:',
    options: [
      { value: 'opus', label: 'Opus', hint: models.opus || '(not set)' },
      { value: 'sonnet', label: 'Sonnet', hint: models.sonnet || '(not set)' },
      { value: 'haiku', label: 'Haiku', hint: models.haiku || '(not set)' },
      { value: 'back', label: 'Back to main menu' },
    ],
  });

  if (p.isCancel(tier) || tier === 'back') {
    return;
  }

  // Re-prompt loop: keep asking until valid model assigned or user cancels
  let done = false;
  while (!done) {
    done = await assignModel(tier);
  }
}
