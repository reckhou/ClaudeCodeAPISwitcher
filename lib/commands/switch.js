import chalk from 'chalk';
import * as p from '@clack/prompts';
import { getOpenRouterKey, saveOpenRouterKey, getAnthropicKey, saveAnthropicKey } from '../keychain.js';
import { getProfilePath, readProfile, writeProfile, buildOpenRouterBlock, buildAnthropicRestoreBlock, injectBlock, removeBlock, clearClaudeModelSetting } from '../profile.js';
import { setMode, getModels, getMode } from '../config.js';

export async function switchTo(target) {
  if (target === 'openrouter') {
    // a. Get OpenRouter API key from keychain
    let openRouterKey = await getOpenRouterKey();

    // b. If no key found, prompt the user
    if (!openRouterKey) {
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

      openRouterKey = key.trim();
      await saveOpenRouterKey(openRouterKey);
    }

    // c. Save existing Anthropic API key to keychain for later restoration
    const existingAnthropicKey = process.env.ANTHROPIC_API_KEY;
    if (existingAnthropicKey && existingAnthropicKey.trim().length > 0) {
      await saveAnthropicKey(existingAnthropicKey);
      console.log(chalk.dim('Saved your Anthropic API key to keychain for later restoration.'));
    }

    // d. Get profile path and read profile
    const profilePath = getProfilePath();
    const profileContent = readProfile(profilePath);

    // e. Build OpenRouter env var block (includes per-tier model overrides)
    const block = buildOpenRouterBlock(openRouterKey, getModels());

    // f. Inject block and write profile
    const newContent = injectBlock(profileContent, block);
    writeProfile(profilePath, newContent);

    // g. Set mode
    setMode('openrouter');

    // h. Print success
    console.log(chalk.green('Switched to OpenRouter. Open a new terminal for changes to take effect.'));

    // i. Windows execution policy warning
    if (process.platform === 'win32') {
      console.log(chalk.yellow('Note: Ensure PowerShell execution policy allows running profile scripts: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser'));
    }

  } else if (target === 'anthropic') {
    // a. Get profile path and read profile
    const profilePath = getProfilePath();
    const profileContent = readProfile(profilePath);

    // b. Check for stored Anthropic API key
    const anthropicKey = await getAnthropicKey();

    // c. Build restore block and inject it (replaces the OpenRouter block)
    //    Passes undefined if no key stored — buildAnthropicRestoreBlock handles this
    const restoreBlock = buildAnthropicRestoreBlock(anthropicKey);
    const newContent = injectBlock(profileContent, restoreBlock);

    // d. Write profile and set mode
    writeProfile(profilePath, newContent);
    setMode('anthropic');

    // e. Clear model override from Claude's settings.json so /model shows default
    clearClaudeModelSetting();

    // f. Print success
    console.log(chalk.green('Switched to Anthropic (native). Open a new terminal for changes to take effect.'));

  } else {
    throw new Error(`Unknown provider: ${target}. Use "openrouter" or "anthropic".`);
  }
}

/**
 * Rebuilds and rewrites the OpenRouter profile block with the currently configured model.
 * Call this after changing a model tier while in openrouter mode.
 */
export async function refreshOpenRouterProfile() {
  if (getMode() !== 'openrouter') return;
  const openRouterKey = await getOpenRouterKey();
  if (!openRouterKey) return;
  const profilePath = getProfilePath();
  const profileContent = readProfile(profilePath);
  const block = buildOpenRouterBlock(openRouterKey, getModels());
  const newContent = injectBlock(profileContent, block);
  writeProfile(profilePath, newContent);
}
