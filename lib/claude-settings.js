import os from 'os';
import path from 'path';
import fs from 'fs';

const CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_PATH = path.join(CLAUDE_CONFIG_DIR, 'settings.json');

function readSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  fs.mkdirSync(CLAUDE_CONFIG_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

export function setClaudeApiOnlyModel(modelId) {
  const settings = readSettings();
  settings.model = modelId;
  writeSettings(settings);
}

export function clearClaudeApiOnlyModel() {
  const settings = readSettings();
  delete settings.model;
  writeSettings(settings);
}
