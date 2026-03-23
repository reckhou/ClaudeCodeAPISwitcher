import Conf from 'conf';

const config = new Conf({
  projectName: 'claude-switcher',
  schema: {
    mode: {
      type: 'string',
      enum: ['anthropic', 'openrouter'],
      default: 'anthropic'
    },
    models: {
      type: 'object',
      default: {
        opus: null,
        sonnet: null,
        haiku: null
      }
    }
  }
});

export function getMode() {
  return config.get('mode');
}

export function setMode(mode) {
  if (mode !== 'anthropic' && mode !== 'openrouter') {
    throw new Error(`Invalid mode: ${mode}. Must be "anthropic" or "openrouter".`);
  }
  config.set('mode', mode);
}

export function getModels() {
  return config.get('models');
}

export function setModel(tier, modelId) {
  config.set(`models.${tier}`, modelId);
}

export { config };
