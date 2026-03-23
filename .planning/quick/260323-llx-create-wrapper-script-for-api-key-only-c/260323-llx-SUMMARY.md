# Quick Task 260323-llx: Summary

**Task:** Create wrapper script for API-key-only Claude Code auth
**Date:** 2026-03-23
**Status:** Complete

## What Was Built

### bin/llx (bash)
Wrapper script for git-bash/WSL/macOS/Linux. Sets `CLAUDE_CONFIG_DIR` to `~/.claude-api-only` (a clean directory with no session token), then execs `claude` with all args passed through. Only ANTHROPIC_API_KEY is seen by Claude Code — no claude.ai token conflict.

### bin/llx.ps1 (PowerShell)
Same behavior for Windows native PowerShell. Sets `$env:CLAUDE_CONFIG_DIR` to `$env:USERPROFILE\.claude-api-only` and invokes `claude @args`.

### lib/commands/llx-setup.js
Setup command that prints alias instructions for the user's platform (PowerShell and git-bash on Windows, bash/zsh on macOS/Linux). Also proactively creates the `~/.claude-api-only` config directory.

### lib/cli.js
Added `--setup-llx` option and `opts.setupLlx` handler that calls `setupLlx()`.

### package.json
Added `"llx": "bin/llx"` to the `bin` field so `npm link` / global install also exposes `llx` directly.

## Key Technical Decision

Used `CLAUDE_CONFIG_DIR` environment variable to point Claude Code at a clean config directory (`~/.claude-api-only`) that has no session token. This means Claude Code only sees ANTHROPIC_API_KEY — no auth conflict warning.

## Usage

```bash
# Set up the alias (run once)
claude-switcher --setup-llx

# Then use llx instead of claude for API-key-only sessions
llx                    # start Claude Code with API key only
llx --help             # all claude args pass through
```
