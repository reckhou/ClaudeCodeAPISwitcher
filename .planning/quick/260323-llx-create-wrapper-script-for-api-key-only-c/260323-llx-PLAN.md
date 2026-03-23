---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - bin/llx
  - bin/llx.ps1
  - lib/commands/llx-setup.js
  - lib/cli.js
autonomous: true
requirements: []
must_haves:
  truths:
    - "User can run 'llx' command and Claude Code starts without auth conflict warning"
    - "ANTHROPIC_API_KEY is passed through to the Claude Code process"
    - "No claude.ai session token is visible to the launched Claude Code instance"
    - "Solution works on Windows (PowerShell/git-bash) environment"
  artifacts:
    - path: "bin/llx"
      provides: "Bash wrapper script for git-bash/WSL"
    - path: "bin/llx.ps1"
      provides: "PowerShell wrapper script for Windows native"
    - path: "lib/commands/llx-setup.js"
      provides: "Setup command that creates the clean config dir and installs aliases"
  key_links:
    - from: "bin/llx"
      to: "claude (CLI)"
      via: "CLAUDE_CONFIG_DIR env override + exec claude"
      pattern: "CLAUDE_CONFIG_DIR.*claude"
---

<objective>
Create wrapper scripts ("llx") that launch Claude Code using only the ANTHROPIC_API_KEY, bypassing the auth conflict with claude.ai session tokens.

Purpose: When a user is logged into claude.ai (which stores a session token in ~/.claude/), AND has ANTHROPIC_API_KEY set, Claude Code shows "Auth conflict" warning. The user wants a separate command that cleanly uses only the API key.

Output: `bin/llx` (bash) and `bin/llx.ps1` (PowerShell) wrapper scripts, plus a setup command integrated into claude-switcher CLI.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@lib/profile.js
@lib/cli.js
@lib/keychain.js
@lib/commands/switch.js
@bin/claude-switcher.js
@package.json

The auth conflict happens because Claude Code checks both:
1. Session token in its config directory (default: ~/.claude/ or platform equivalent)
2. ANTHROPIC_API_KEY environment variable

The fix: launch claude with CLAUDE_CONFIG_DIR pointing to a separate, clean directory that has no session token. This way Claude Code only sees the API key.

Key technical details:
- Claude Code respects CLAUDE_CONFIG_DIR env var to override its config location
- The wrapper must preserve all other env vars (especially ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL)
- The clean config dir needs to exist but can be mostly empty
- The wrapper should pass through all CLI arguments to claude
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create llx wrapper scripts (bash + PowerShell)</name>
  <files>bin/llx, bin/llx.ps1</files>
  <action>
Create two wrapper scripts that launch Claude Code with an isolated config directory:

**bin/llx (bash script for git-bash/WSL/macOS/Linux):**
- Shebang: `#!/usr/bin/env bash`
- Set `LLX_CONFIG_DIR` to `$HOME/.claude-api-only` (a separate config dir with no session token)
- Create the directory if it doesn't exist: `mkdir -p "$LLX_CONFIG_DIR"`
- Export `CLAUDE_CONFIG_DIR="$LLX_CONFIG_DIR"` so Claude Code uses the clean dir
- Exec `claude "$@"` to pass through all arguments and replace the shell process
- Add a comment header explaining the purpose

**bin/llx.ps1 (PowerShell script for Windows native):**
- Set `$LlxConfigDir` to `"$env:USERPROFILE\.claude-api-only"`
- Create directory if not exists: `New-Item -ItemType Directory -Force -Path $LlxConfigDir | Out-Null`
- Set `$env:CLAUDE_CONFIG_DIR = $LlxConfigDir`
- Invoke `claude @args` to pass through all arguments
- Add a comment header explaining the purpose

Both scripts should:
- NOT modify ANTHROPIC_API_KEY or any other env vars (just pass them through)
- NOT clear or set ANTHROPIC_AUTH_TOKEN (leave environment as-is except for CLAUDE_CONFIG_DIR)
- Be minimal — under 20 lines each
  </action>
  <verify>
    <automated>bash -c "head -5 bin/llx && echo '---' && head -5 bin/llx.ps1 && echo '---' && test -f bin/llx && test -f bin/llx.ps1 && echo 'PASS: Both files exist'"</automated>
  </verify>
  <done>bin/llx and bin/llx.ps1 exist, are readable, contain CLAUDE_CONFIG_DIR override pointing to ~/.claude-api-only, and pass through all args to claude</done>
</task>

<task type="auto">
  <name>Task 2: Add llx-setup command to CLI and update package.json bin entry</name>
  <files>lib/commands/llx-setup.js, lib/cli.js, package.json</files>
  <action>
**lib/commands/llx-setup.js** — Create a setup command that helps users install the llx alias:

```
import chalk from 'chalk';
import os from 'os';
import path from 'path';
import fs from 'fs';
```

Export async function `setupLlx()` that:
1. Determines the absolute path to `bin/llx` (or `bin/llx.ps1` on Windows) using `import.meta.url` to find the package root (resolve from `../..` relative to the module)
2. On Windows (process.platform === 'win32'):
   - Print instructions to add an alias to PowerShell profile:
     `Set-Alias -Name llx -Value "<absolute-path-to-bin/llx.ps1>"`
   - Also print git-bash alias instruction:
     `alias llx='<absolute-path-to-bin/llx>'`
   - Print: "Add one of these to your shell profile, then open a new terminal."
3. On macOS/Linux:
   - Print instruction to add to .bashrc/.zshrc:
     `alias llx='<absolute-path-to-bin/llx>'`
   - Print: "Add this to your shell profile, then open a new terminal."
4. Also create the clean config dir (`~/.claude-api-only`) proactively
5. Print a success message explaining what llx does: "llx runs Claude Code using only your API key, bypassing claude.ai session token conflicts."

**lib/cli.js** — Add `--setup-llx` option:
- Add `.option('--setup-llx', 'Set up the llx command (API-key-only Claude Code launcher)')` to the program options
- Add handler in the try block: `else if (opts.setupLlx) { await setupLlx(); }` — import setupLlx from './commands/llx-setup.js'
- Place the handler BEFORE the else (menu) branch but after the existing model set handlers

**package.json** — Add `llx` to the bin field:
- Add `"llx": "bin/llx"` alongside the existing `"claude-switcher"` entry so that `npm link` or global install also exposes the llx command directly
  </action>
  <verify>
    <automated>node -e "import('./lib/commands/llx-setup.js').then(m => { console.log(typeof m.setupLlx === 'function' ? 'PASS: setupLlx exported' : 'FAIL'); })" && node -e "import('./lib/cli.js').then(() => console.log('PASS: cli.js imports cleanly'))" && node -e "const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(pkg.bin.llx ? 'PASS: llx in bin' : 'FAIL')"