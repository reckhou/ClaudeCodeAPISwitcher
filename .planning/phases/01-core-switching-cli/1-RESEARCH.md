# Phase 1: Core Switching & CLI - Research

**Researched:** 2026-03-23
**Domain:** Node.js CLI tooling, OS keychain, shell profile injection, npm global distribution
**Confidence:** MEDIUM-HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Switch by injecting `ANTHROPIC_BASE_URL` and `ANTHROPIC_API_KEY` into the user's shell profile
- **D-02:** Auto-detect shell: write to PowerShell `$PROFILE` on Windows (`$env:VAR = "value"` syntax), write to `~/.zshrc` or `~/.bashrc` on macOS/Linux (`export VAR=value` syntax)
- **D-03:** Switching to OpenRouter sets `ANTHROPIC_BASE_URL=https://openrouter.ai/api` and swaps the API key; switching back to Anthropic removes/restores the original values
- **D-04:** Changes take effect in new terminal sessions (env var injection approach — no wrapper script required)
- **D-05:** Distributed as an npm package installed globally from the GitHub repo: `npm install -g github:user/ClaudeCodeAPISwitcher`
- **D-06:** Exposes a global `claude-switcher` command (defined in `bin` in package.json)
- **D-07:** No npm registry account needed — installs directly from GitHub, compatible with private repos
- **D-08:** Use OS native keychain via `keytar` package — Windows Credential Manager, macOS Keychain, Linux Secret Service
- **D-09:** First run prompts the user for their OpenRouter API key and saves it to the keychain
- **D-10:** Original Anthropic API key (if set) is also stored in the keychain on first switch, so it can be restored cleanly
- **D-11:** Running `claude-switcher` with no arguments launches an interactive menu (arrow-key navigation via `inquirer` or equivalent)
- **D-12:** Direct flags also supported for scripting: `--use openrouter`, `--use anthropic`, `--status`
- **D-13:** `--status` (or `claude-switcher status`) shows current mode and all tier-to-model mappings at a glance

### Claude's Discretion

- Exact interactive menu library (inquirer vs clack vs prompts — pick best fit for Node.js + Windows compatibility)
- Error message wording
- Color/styling in terminal output
- Exact config file schema beyond key fields

### Deferred Ideas (OUT OF SCOPE)

- Per-project API config override — v2 requirement, not in scope for v1
- Multiple named profiles (e.g., "work", "personal") — v2 requirement
- Model selection UI — Phase 2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SWIT-01 | User can switch Claude Code to OpenRouter API mode | Shell profile injection with ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN env vars; idempotent marker-block pattern |
| SWIT-02 | User can switch Claude Code back to vanilla Anthropic API mode | Remove injected block from shell profile; restore ANTHROPIC_API_KEY from keychain |
| SWIT-03 | Current mode (Anthropic/OpenRouter) is clearly displayed | Read config file for active mode; chalk for colored terminal output |
| SWIT-04 | Switch persists across sessions | Shell profile injection survives terminal restarts; new sessions read env vars on startup |
| CLI-01 | Interactive menu mode for browsing and changing settings | @clack/prompts (recommended over inquirer) for arrow-key navigation; confirmed Windows compatible |
| CLI-02 | Direct command flags for scripting | commander v14 for flag parsing (`--use`, `--status`) |
| CLI-03 | Status command shows current mode and all tier mappings | Read config file + display; chalk for formatting |
</phase_requirements>

---

## Summary

This phase builds a Node.js CLI tool that switches Claude Code between the native Anthropic API and OpenRouter by injecting environment variables into the user's shell profile. The tool is distributed via `npm install -g github:user/repo` and exposes a `claude-switcher` binary.

The primary technical challenges are: (1) idempotent shell profile injection that works across PowerShell on Windows and bash/zsh on macOS/Linux; (2) secure API key storage via OS keychain; and (3) a working interactive menu on Windows terminals. Each of these has well-understood solutions but has specific pitfalls detailed below.

**Critical finding on keytar:** The `keytar` package (atom/node-keytar) was archived on December 15, 2022 and receives no security patches. It remains installable and functional via prebuilt binaries on Node.js LTS versions, but requires native build tooling if no prebuilt exists. A safe, maintained fork (`keytar-sync` v7.9.1) exists and is API-compatible. The decision to use keytar (D-08) is implementable — use `keytar-sync` instead of `keytar` proper.

**Critical finding on OpenRouter base URL:** The correct value is `https://openrouter.ai/api` (without `/v1`). Claude Code requires both `ANTHROPIC_BASE_URL` AND `ANTHROPIC_AUTH_TOKEN` to be set, with `ANTHROPIC_API_KEY` explicitly set to an empty string.

**Primary recommendation:** Use `keytar-sync` (API-identical to `keytar`), `@clack/prompts` for the interactive menu, and `commander` for flag parsing. Use a tagged comment block pattern for idempotent shell profile injection.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| keytar-sync | 7.9.1 | OS keychain access (Windows Credential Manager, macOS Keychain, Linux Secret Service) | API-identical fork of the archived `keytar`; includes prebuilt binaries; last published 2023 |
| commander | 14.0.3 | CLI flag parsing (`--use`, `--status`, subcommands) | De facto standard for Node.js CLI flag parsing; clean API; actively maintained |
| @clack/prompts | 1.1.0 | Interactive menu with arrow-key navigation | Modern, beautiful output; confirmed Windows compatible; simpler API than inquirer |
| chalk | 5.6.2 | Terminal color output | Standard terminal styling; tree-shakable ESM; v5 is pure ESM |
| conf | 15.1.0 | Config file persistence (JSON, cross-platform paths) | Handles XDG/AppData path resolution automatically; type-safe |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ora | 9.3.0 | Spinner for async operations | During keychain read/write operations that may take a moment |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| keytar-sync | keytar (original) | `keytar` is archived; `keytar-sync` is maintained fork with same API |
| keytar-sync | @postman/final-node-keytar | **DO NOT USE** — confirmed supply chain attack (Shai-Hulud 2.0, Nov 2025) — credentials harvesting malware |
| @clack/prompts | inquirer / @inquirer/prompts | inquirer has known Windows terminal hang issues; clack has cleaner API and better Windows support |
| conf | custom JSON | conf handles platform-specific config paths (AppData on Windows, ~/.config on Linux) automatically |
| chalk v5 | chalk v4 | v5 is pure ESM; if package.json uses `"type": "module"` use v5; if CommonJS use v4 |

**Installation:**

```bash
npm install keytar-sync commander @clack/prompts chalk conf
```

**Version verification (confirmed 2026-03-23):**
- keytar-sync: 7.9.1
- commander: 14.0.3
- @clack/prompts: 1.1.0
- chalk: 5.6.2
- conf: 15.1.0

---

## Architecture Patterns

### Recommended Project Structure

```
ClaudeCodeAPISwitcher/
├── bin/
│   └── claude-switcher.js    # Entry point with shebang; minimal — delegates to lib/
├── lib/
│   ├── cli.js                # Commander setup; routes to commands
│   ├── commands/
│   │   ├── switch.js         # --use openrouter / --use anthropic logic
│   │   ├── status.js         # --status display logic
│   │   └── menu.js           # Interactive @clack/prompts menu
│   ├── keychain.js           # keytar-sync wrapper (get/set Anthropic + OpenRouter keys)
│   ├── profile.js            # Shell profile read/write/detect (PowerShell + bash/zsh)
│   └── config.js             # conf wrapper (active mode, metadata)
├── package.json              # bin: { "claude-switcher": "bin/claude-switcher.js" }
└── .planning/                # GSD planning artifacts
```

### Pattern 1: Shebang + ESM/CJS Entry Point

**What:** The `bin/` entry file must start with `#!/usr/bin/env node` for npm to make it executable globally.

**When to use:** Always — required for `npm install -g` to wire up the global command.

```javascript
#!/usr/bin/env node
// bin/claude-switcher.js
import { run } from '../lib/cli.js';
run();
```

For the global `bin` field in package.json:

```json
{
  "name": "claude-code-api-switcher",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "claude-switcher": "bin/claude-switcher.js"
  }
}
```

### Pattern 2: Idempotent Shell Profile Injection (Marker Block)

**What:** Wrap injected env vars in a tagged comment block. On switch, find-and-replace the entire block. On restore, remove the block entirely.

**When to use:** Every read/write to shell profile — prevents duplicate entries across multiple switch calls.

**PowerShell (`$PROFILE`):**
```powershell
# BEGIN claude-switcher
$env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api"
$env:ANTHROPIC_AUTH_TOKEN = "sk-or-..."
$env:ANTHROPIC_API_KEY = ""
# END claude-switcher
```

**bash/zsh (`~/.zshrc` or `~/.bashrc`):**
```bash
# BEGIN claude-switcher
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="sk-or-..."
export ANTHROPIC_API_KEY=""
# END claude-switcher
```

**Node.js implementation pattern:**
```javascript
// lib/profile.js
const MARKER_START = '# BEGIN claude-switcher';
const MARKER_END = '# END claude-switcher';

export function injectBlock(profileContent, block) {
  const re = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`, 'm');
  const newBlock = `${MARKER_START}\n${block}\n${MARKER_END}\n`;
  if (re.test(profileContent)) {
    return profileContent.replace(re, newBlock);
  }
  return profileContent + '\n' + newBlock;
}

export function removeBlock(profileContent) {
  const re = new RegExp(`\\n?${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`, 'm');
  return profileContent.replace(re, '');
}
```

### Pattern 3: OpenRouter Environment Variables

**What:** The exact set of env vars Claude Code reads. This is the authoritative configuration verified against OpenRouter docs (2026-03-23).

**Source:** https://openrouter.ai/docs/guides/coding-agents/claude-code-integration

```
ANTHROPIC_BASE_URL   = "https://openrouter.ai/api"   ← no /v1 suffix
ANTHROPIC_AUTH_TOKEN = "<openrouter-api-key>"          ← OR key goes here
ANTHROPIC_API_KEY    = ""                              ← MUST be explicitly empty string
```

**Restoring to Anthropic:**
```
# Remove ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN from profile
# Restore ANTHROPIC_API_KEY to original value (retrieved from keychain)
```

### Pattern 4: keytar-sync Keychain Usage

```javascript
// lib/keychain.js
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
```

### Pattern 5: Shell Profile Path Detection

```javascript
// lib/profile.js
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

export function getProfilePath() {
  const platform = os.platform();

  if (platform === 'win32') {
    // PowerShell $PROFILE path on Windows
    // CurrentUserCurrentHost = C:\Users\<name>\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
    try {
      const profilePath = execSync('powershell -NoProfile -Command "echo $PROFILE"', {
        encoding: 'utf8'
      }).trim();
      return profilePath;
    } catch {
      // Fallback: construct manually
      return path.join(os.homedir(), 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
    }
  }

  // macOS/Linux: prefer zsh if $SHELL indicates it, else bash
  const shell = process.env.SHELL || '/bin/bash';
  if (shell.includes('zsh')) {
    return path.join(os.homedir(), '.zshrc');
  }
  return path.join(os.homedir(), '.bashrc');
}
```

### Pattern 6: @clack/prompts Interactive Menu

```javascript
// lib/commands/menu.js
import * as p from '@clack/prompts';

export async function runMenu(currentMode) {
  p.intro('Claude Code API Switcher');

  const action = await p.select({
    message: `Current mode: ${currentMode}. What would you like to do?`,
    options: [
      { value: 'openrouter', label: 'Switch to OpenRouter' },
      { value: 'anthropic', label: 'Switch to Anthropic (native)' },
      { value: 'status', label: 'Show status' },
      { value: 'exit', label: 'Exit' },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  return action;
}
```

### Anti-Patterns to Avoid

- **Writing raw env vars without markers:** Appending `export VAR=value` without markers causes duplicates on every switch call.
- **Using `keytar` (original atom package):** Archived 2022; no security patches; use `keytar-sync` instead.
- **Using `@postman/final-node-keytar`:** CONFIRMED MALWARE (supply chain attack Nov 2025) — do not use under any circumstances.
- **Setting ANTHROPIC_BASE_URL to `https://openrouter.ai/api/v1`:** The correct URL is `https://openrouter.ai/api` without `/v1`. Using the wrong URL will cause 404s.
- **Omitting ANTHROPIC_API_KEY="":** If `ANTHROPIC_API_KEY` is unset (not empty string), Claude Code may attempt Anthropic authentication and fail.
- **Chalk v5 in CommonJS context:** If using `require()` (no `"type":"module"` in package.json), use chalk v4. Chalk v5 is pure ESM and will throw in CJS.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OS keychain access | Custom credential storage | keytar-sync | Windows Credential Manager, macOS Keychain, Linux Secret Service — each has different APIs; keytar-sync wraps all three |
| Config file paths | Manual path detection | conf | Handles Windows AppData, Linux XDG_CONFIG_HOME, macOS ~/Library/Preferences automatically |
| CLI flag parsing | Custom argv parser | commander | Edge cases: `--` separator, negated flags, subcommand routing, help generation |
| Interactive prompts | Raw readline | @clack/prompts | Arrow-key navigation, cancel handling (Ctrl+C), Windows terminal compatibility |
| Terminal colors | ANSI escape codes | chalk | Handles NO_COLOR, terminal capability detection, Windows cmd.exe differences |

**Key insight:** Shell profile modification is the only custom work in this phase that has no off-the-shelf solution. Everything else has a battle-tested library.

---

## Common Pitfalls

### Pitfall 1: Wrong OpenRouter Base URL

**What goes wrong:** Requests return 404 or connection errors from Claude Code.

**Why it happens:** Many examples online incorrectly show `https://openrouter.ai/api/v1`. The correct URL for the Anthropic-compatible endpoint is `https://openrouter.ai/api` (no `/v1`).

**How to avoid:** Hardcode `https://openrouter.ai/api` — do not derive from OpenRouter's general API docs which use `/api/v1` for OpenAI-compatible endpoints.

**Warning signs:** Claude Code errors about API endpoint not found, 404 responses.

### Pitfall 2: ANTHROPIC_API_KEY Must Be Empty String, Not Unset

**What goes wrong:** Claude Code ignores ANTHROPIC_BASE_URL and tries to authenticate with Anthropic directly.

**Why it happens:** Claude Code has fallback logic: if `ANTHROPIC_API_KEY` is present and non-empty, it uses the Anthropic API regardless of `ANTHROPIC_BASE_URL`.

**How to avoid:** When injecting OpenRouter config into shell profile, explicitly set `ANTHROPIC_API_KEY=""` (PowerShell: `$env:ANTHROPIC_API_KEY = ""`).

**Warning signs:** "Invalid API key" errors from Anthropic rather than OpenRouter errors.

### Pitfall 3: Shell Profile Doesn't Exist Yet

**What goes wrong:** `fs.readFileSync` throws ENOENT; write fails.

**Why it happens:** PowerShell profile file is not created until the user customizes it. The directory may also not exist (`~/Documents/PowerShell/`).

**How to avoid:** Always use `fs.existsSync` check; create the file (and parent directories with `mkdir -p` equivalent) if it doesn't exist. For PowerShell, the containing directory must also be created.

**Warning signs:** ENOENT errors on first run.

### Pitfall 4: keytar/keytar-sync Native Build Failures on Install

**What goes wrong:** `npm install -g github:user/repo` fails with native module compilation errors.

**Why it happens:** keytar-sync is a native Node.js addon. If no prebuilt binary matches the exact Node.js version, npm attempts to compile from source, which requires Python and build tools (Visual Studio Build Tools on Windows).

**How to avoid:** Document the requirement. Add `engines` field to package.json. Consider providing a plaintext fallback (with warning) if keychain fails, storing key in conf file with a warning about security.

**Warning signs:** `node-gyp` errors during install, missing Python errors.

### Pitfall 5: PowerShell Execution Policy Blocks Profile

**What goes wrong:** PowerShell silently ignores the profile file on startup. Environment variables are never loaded despite being written correctly.

**Why it happens:** Default Windows PowerShell execution policy is `Restricted`, which prevents running `.ps1` scripts including `$PROFILE`.

**How to avoid:** After writing the profile, detect if the execution policy is restrictive and warn the user. Suggest: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`.

**Warning signs:** Env vars not visible after opening new terminal, even though profile file has correct content.

### Pitfall 6: ESM vs CommonJS Module Format

**What goes wrong:** `require()` calls fail, or `import` syntax causes syntax errors.

**Why it happens:** chalk v5, @clack/prompts, and conf are ESM-only. If the package uses CommonJS (no `"type":"module"` in package.json), these imports will fail.

**How to avoid:** Use `"type": "module"` in package.json and write all source files as ESM (`import`/`export`). Use chalk v5, not v4.

**Warning signs:** `ERR_REQUIRE_ESM` on startup.

---

## Runtime State Inventory

> Greenfield project — no existing runtime state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — first phase, no prior data | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None pre-existing from this tool | None |
| Build artifacts | None | None |

Nothing found in any category — verified by project STATE.md ("greenfield project, first phase sets the patterns").

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v25.8.1 | — |
| npm | Package management | Yes | (available with Node) | — |
| PowerShell | Windows profile injection | Yes (Windows host) | — | Use fallback path construction if `powershell` command fails |
| Python / build tools | keytar-sync native build (fallback only) | Unknown | — | Pre-built binaries cover most Node LTS; document requirement if build needed |

**Missing dependencies with no fallback:**
- None that block the core implementation.

**Missing dependencies with fallback:**
- Python / Visual Studio Build Tools: Only needed if keytar-sync prebuilt binary is absent for the user's Node.js version. Pre-built binaries typically cover current Node.js LTS.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `inquirer` for interactive menus | `@clack/prompts` | 2022-2023 | Better Windows compatibility, cleaner cancel handling |
| `keytar` (atom/node-keytar) | `keytar-sync` (maintained fork) | Dec 2022 (archived) | Use keytar-sync instead — same API |
| chalk v4 (CJS) | chalk v5 (pure ESM) | 2022 | Requires `"type":"module"` in package.json |
| OpenRouter `/api/v1` endpoint | OpenRouter `/api` (Anthropic-compatible) | — | Different URL for Anthropic-protocol vs OpenAI-protocol |

**Deprecated/outdated:**

- `keytar` (original): Archived Dec 2022; no patches; do not use.
- `@postman/final-node-keytar`: MALWARE — confirmed supply chain attack (Shai-Hulud 2.0, Nov 2025).
- `inquirer` v8 and below: CommonJS-only; v9+ is ESM but has Windows hang issues.

---

## Open Questions

1. **Chalk ESM + Node.js version compatibility**
   - What we know: chalk v5 is pure ESM; works with `"type":"module"`; Node.js v25.8.1 is installed (ESM fully supported)
   - What's unclear: Whether the user's production machines will all be on Node.js 18+
   - Recommendation: Use chalk v5 with ESM; add `"engines": { "node": ">=18" }` to package.json

2. **keytar-sync prebuilt binary coverage for Node.js 25**
   - What we know: keytar-sync v7.9.1 uses N-API prebuilds which are more version-agnostic than nan-based builds
   - What's unclear: Whether prebuilts include Node.js 25 specifically (last commit 2023, predates Node 25)
   - Recommendation: Plan for graceful degradation — catch keychain errors and offer plaintext config file fallback with a security warning

3. **PowerShell vs PowerShell Core**
   - What we know: Windows has both Windows PowerShell (`%USERPROFILE%\Documents\WindowsPowerShell\`) and PowerShell Core (`%USERPROFILE%\Documents\PowerShell\`); `$PROFILE` returns the correct path for the running shell
   - What's unclear: Which shell the user launches Claude Code from (Windows PowerShell vs PowerShell 7+)
   - Recommendation: Use `powershell -NoProfile -Command "echo $PROFILE"` to resolve the live path; if that fails, write to both profile paths

---

## Sources

### Primary (HIGH confidence)

- OpenRouter official docs (https://openrouter.ai/docs/guides/coding-agents/claude-code-integration) — ANTHROPIC_BASE_URL value `https://openrouter.ai/api`, ANTHROPIC_AUTH_TOKEN vs ANTHROPIC_API_KEY behavior
- npm registry — verified package versions for keytar-sync (7.9.1), commander (14.0.3), @clack/prompts (1.1.0), chalk (5.6.2), conf (15.1.0) on 2026-03-23
- Microsoft Learn (https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_profiles) — PowerShell profile paths and precedence
- npm docs (https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `bin` field behavior for global installs

### Secondary (MEDIUM confidence)

- GitHub atom/node-keytar archived status — confirmed via multiple community issue threads (element-desktop #1947, joplin #8829, vscode #185677)
- keytar-sync repository (https://github.com/itfilip/node-keytar) — confirmed API-compatible fork, last published 2023-03-15
- @clack/prompts npm page — confirmed version 1.1.0, CLI/prompts category, no known Windows issues

### Tertiary (LOW confidence, flag for validation)

- `@postman/final-node-keytar` malware claim — sourced from single WebSearch result mentioning "Shai-Hulud 2.0" supply chain attack; independently flagged by GitLab Advisory Database entry; treat as HIGH risk regardless — original keytar is safer if needed
- keytar-sync prebuilt binary support for Node.js 25 — not verified; N-API claim is based on v7.7.0+ pattern; test at implementation time

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all versions verified against npm registry 2026-03-23
- OpenRouter URL: HIGH — verified against official OpenRouter docs
- Architecture patterns: MEDIUM — shell injection patterns based on verified Node.js fs APIs + community patterns
- keytar status: HIGH — archived status widely confirmed by VSCode, Joplin, element-desktop issue threads
- keytar-sync safety: MEDIUM — functional fork, but not as widely audited as the original
- Pitfalls: MEDIUM-HIGH — most derived from official docs or widely-reported community issues

**Research date:** 2026-03-23
**Valid until:** 2026-06-23 (90 days — keytar situation and OpenRouter URL are stable; npm package versions may shift)
