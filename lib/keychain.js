import keytar from 'keytar-sync';

const SERVICE = 'claude-switcher';

export async function saveOpenRouterKey(key) {
  await keytar.setPassword(SERVICE, 'openrouter-api-key', key);
}

export async function getOpenRouterKey() {
  return keytar.getPassword(SERVICE, 'openrouter-api-key');
}

export async function saveAnthropicKey(key) {
  await keytar.setPassword(SERVICE, 'anthropic-api-key', key);
}

export async function getAnthropicKey() {
  return keytar.getPassword(SERVICE, 'anthropic-api-key');
}

export async function deleteAnthropicKey() {
  return keytar.deletePassword(SERVICE, 'anthropic-api-key');
}
