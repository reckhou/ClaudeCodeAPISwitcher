# Claude Code API Switcher

Switch Claude Code between Anthropic (native) and OpenRouter APIs. Manage API keys, configure per-tier model assignments, and toggle providers — all through an interactive menu or CLI flags.

## Installation

Requires Node.js 18+.

```bash
npm install -g github:reckhou/ClaudeCodeAPISwitcher
```

This installs the `claude-switcher` global command.

## Usage

### Interactive Menu

Run without flags to launch the interactive menu:

```bash
claude-switcher
```

The menu lets you:
- Switch to OpenRouter or Anthropic (native)
- Show detailed status
- Configure per-tier model mappings (Opus, Sonnet, Haiku)

### CLI Flags

Switch providers directly:

```bash
claude-switcher --use openrouter
claude-switcher --use anthropic
```

Show current status:

```bash
claude-switcher --status
```

Assign OpenRouter models to specific tiers:

```bash
claude-switcher --set-opus "google/gemini-2.0-flash-exp"
claude-switcher --set-sonnet "openai/gpt-4o"
claude-switcher --set-haiku "meta-llama/llama-3-8b-instruct"
```

## Configuration

The tool stores:
- **API keys** — saved to the system keychain (secure)
- **Mode and model mappings** — saved to `conf` config store
- **Profile injection** — appends/removes a block in your Claude Code profile script (`~/.claude/profile.*`)

### OpenRouter Model Assignment

When using OpenRouter, you can assign specific models to each Claude tier. The tool validates the model ID against OpenRouter's API before saving. For example:

| Tier  | Example Model ID                     |
|-------|--------------------------------------|
| Opus  | `google/gemini-2.0-flash-exp`        |
| Sonnet| `openai/gpt-4o`                      |
| Haiku | `meta-llama/llama-3-8b-instruct`     |

Any model available on OpenRouter can be assigned to any tier.

## How It Works

The tool works by injecting environment variables into your Claude Code profile script:

- **OpenRouter mode** — sets `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_BASE_URL`, and per-tier model overrides (`ANTHROPIC_MODEL_OPUS`, etc.)
- **Anthropic mode** — restores the original `ANTHROPIC_API_KEY` and removes OpenRouter configuration

Open a new terminal after switching for changes to take effect.

## Requirements

- Node.js 18+
- [Claude Code](https://claude.ai/code) installed
- macOS, Linux, or Windows
