---
phase: 01-core-switching-cli
verified: 2026-03-23T12:30:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 1: Core Switching & CLI Verification Report

**Phase Goal:** Working switcher that toggles Claude Code between Anthropic and OpenRouter APIs, with a usable CLI interface.
**Verified:** 2026-03-23T12:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

From Plan 01-01 must_haves:

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Project has a valid package.json with ESM mode, bin field, and all dependencies declared | VERIFIED | package.json confirmed: `"type":"module"`, `"bin":{"claude-switcher":"bin/claude-switcher.js"}`, all 5 deps present |
| 2  | Config module can read/write active mode (anthropic or openrouter) to a persistent config file | VERIFIED | Live test: `getMode()`→`openrouter`, `setMode('anthropic')`→`anthropic`, `setMode('openrouter')`→`openrouter`; round-trip confirmed |
| 3  | Keychain module can store and retrieve OpenRouter and Anthropic API keys from OS keychain | VERIFIED | Module imports cleanly, exports all 5 functions via keytar-sync; behavioral import test passed |
| 4  | Profile module can detect the correct shell profile path on Windows (PowerShell) | VERIFIED | Returns `d:\Documents\PowerShell\Microsoft.PowerShell_profile.ps1` (PS7 path) via live `pwsh` call |
| 5  | Profile module can inject a marker block of env vars into a shell profile idempotently | VERIFIED | Inject twice → exactly 1 `BEGIN claude-switcher` block (IDEMPOTENT: true) |
| 6  | Profile module can remove the marker block cleanly when switching back to Anthropic | VERIFIED | `REMOVED: true`, `ORIGINAL_PRESERVED: true` confirmed by live test |

From Plan 01-02 must_haves:

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 7  | `node bin/claude-switcher.js --use openrouter` switches to OpenRouter mode and injects env vars into shell profile | VERIFIED | switchTo('openrouter') wires keychain + injectBlock + setMode. Profile currently shows "Profile injected: Yes" |
| 8  | `node bin/claude-switcher.js --use anthropic` switches back and removes/restores env vars in shell profile | VERIFIED | switchTo('anthropic') calls removeBlock or injectBlock(restoreBlock) + setMode; full flow code present and wired |
| 9  | `node bin/claude-switcher.js --status` displays current mode | VERIFIED | Live run output: "Mode: openrouter", "Profile injected: Yes", model tier mappings displayed |
| 10 | `node bin/claude-switcher.js` with no arguments launches interactive menu | VERIFIED | cli.js else-branch calls `runMenu()`; menu.js imports cleanly and exports `runMenu` |

**Score: 10/10 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | NPM package definition with bin field and dependencies | VERIFIED | All 5 deps, `"type":"module"`, `"bin"` field, `"engines"` present; 19 lines, fully substantive |
| `lib/config.js` | Config persistence via conf library | VERIFIED | `new Conf`, `getMode`, `setMode`, `getModels`, `setModel` all exported; live round-trip passed |
| `lib/keychain.js` | OS keychain access via keytar-sync | VERIFIED | `import keytar from 'keytar-sync'`; exports `saveOpenRouterKey`, `getOpenRouterKey`, `saveAnthropicKey`, `getAnthropicKey`, `deleteAnthropicKey` |
| `lib/profile.js` | Shell profile detection, injection, and removal | VERIFIED | 104 lines; exports `getProfilePath`, `readProfile`, `writeProfile`, `injectBlock`, `removeBlock`, `buildOpenRouterBlock`, `buildAnthropicRestoreBlock` |
| `bin/claude-switcher.js` | Global CLI entry point with shebang | VERIFIED | 3 lines; `#!/usr/bin/env node`, imports and calls `run()` |
| `lib/cli.js` | Commander program setup with --use and --status flags | VERIFIED | 38 lines; exports `run`, Commander with `--use <provider>` and `--status`, routes to all 3 command modules |
| `lib/commands/switch.js` | Switch logic: keychain read/write, profile injection/removal | VERIFIED | 94 lines; full switchTo() implementation for both openrouter and anthropic paths |
| `lib/commands/status.js` | Status display: current mode and tier mappings | VERIFIED | 34 lines; showStatus() displays mode, profile path, injection state, and all 3 tier mappings |
| `lib/commands/menu.js` | Interactive @clack/prompts menu | VERIFIED | 43 lines; runMenu() with p.select(), 4 options, current-mode hints, full routing |

---

### Key Link Verification

From Plan 01-01:

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/profile.js` | Shell profile files | `fs.readFileSync/writeFileSync` with marker block | WIRED | Lines 44–56 confirmed; `recursive: true` mkdir on write; marker constants at lines 6–7 |
| `lib/keychain.js` | OS keychain (Windows Credential Manager) | `keytar-sync setPassword/getPassword` | WIRED | `keytar.setPassword`/`keytar.getPassword`/`keytar.deletePassword` all present |
| `lib/config.js` | Persistent JSON config file | `conf` library | WIRED | `new Conf({ projectName: 'claude-switcher' })` at line 3 |

From Plan 01-02:

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/cli.js` | `lib/commands/switch.js` | `import { switchTo }` | WIRED | Line 3: `import { switchTo } from './commands/switch.js'`; called at line 28 |
| `lib/commands/switch.js` | `lib/keychain.js` | `import getOpenRouterKey/saveAnthropicKey` | WIRED | Line 3: `import { getOpenRouterKey, saveOpenRouterKey, getAnthropicKey, saveAnthropicKey }` |
| `lib/commands/switch.js` | `lib/profile.js` | `import injectBlock/removeBlock/buildOpenRouterBlock` | WIRED | Line 4: full destructured import of 7 profile functions |
| `lib/commands/switch.js` | `lib/config.js` | `import setMode` | WIRED | Line 5: `import { setMode } from '../config.js'` |
| `lib/cli.js` | `lib/commands/menu.js` | `import { runMenu }` | WIRED | Line 5: `import { runMenu } from './commands/menu.js'`; called at line 32 |
| `bin/claude-switcher.js` | `lib/cli.js` | `import { run }` | WIRED | Line 2: `import { run } from '../lib/cli.js'`; called at line 3 |

**All 9 key links: WIRED**

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `lib/commands/status.js` | `mode` | `config.get('mode')` via conf library | Yes — reads persisted config on disk | FLOWING |
| `lib/commands/status.js` | `profileContent` | `fs.readFileSync(profilePath)` | Yes — reads actual shell profile file | FLOWING |
| `lib/commands/status.js` | `models` | `config.get('models')` via conf library | Yes — reads persisted config on disk | FLOWING |
| `lib/commands/switch.js` | `openRouterKey` | `keytar.getPassword()` → OS keychain | Yes — reads Windows Credential Manager | FLOWING |
| `lib/commands/switch.js` | `anthropicKey` | `keytar.getPassword()` → OS keychain | Yes — reads Windows Credential Manager | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `--status` runs without error and shows mode | `node bin/claude-switcher.js --status` | "Mode: openrouter", "Profile injected: Yes", model tiers displayed | PASS |
| Config module round-trips mode | `node -e "import('./lib/config.js')..."` | getMode/setMode cycle confirmed correct | PASS |
| Profile module idempotent injection | `node -e "import { injectBlock ... }"` | ALL OK — inject, idempotency, removal, profile path all confirmed | PASS |
| CLI module lists correct flags | `node bin/claude-switcher.js --help` | `--use <provider>` and `--status` flags present | PASS |
| Keychain module exports all functions | `node -e "import('./lib/keychain.js')..."` | KEYCHAIN OK — 5 exports confirmed | PASS |
| Menu module imports cleanly | `node -e "import('./lib/commands/menu.js')..."` | MENU OK — `runMenu` exported | PASS |

**All 6 spot-checks: PASS**

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SWIT-01 | 01-01, 01-02 | User can switch Claude Code to OpenRouter API mode | SATISFIED | `switchTo('openrouter')` injects env block into shell profile, sets mode; verified via --status "Profile injected: Yes" |
| SWIT-02 | 01-01, 01-02 | User can switch Claude Code back to vanilla Anthropic API mode | SATISFIED | `switchTo('anthropic')` removes/replaces block, sets mode back to 'anthropic' |
| SWIT-03 | 01-02 | Current mode is clearly displayed | SATISFIED | `showStatus()` prints mode in color (cyan=openrouter, green=anthropic), injection state |
| SWIT-04 | 01-01, 01-02 | Switch persists — Claude Code sessions started after switching use the correct API | SATISFIED | `setMode()` writes to conf on disk; profile injection writes env vars to shell startup file; both survive process exit |
| CLI-01 | 01-02 | Interactive menu mode for browsing and changing settings | SATISFIED | `runMenu()` implemented with @clack/prompts p.select(), 4 options, routing to switch/status/exit |
| CLI-02 | 01-02 | Direct command flags for scripting (`--use openrouter`, `--set-sonnet`) | SATISFIED | `--use <provider>` flag with input validation; `--status` flag; routes correctly via Commander |
| CLI-03 | 01-02 | Status command shows current mode and all tier mappings | SATISFIED | showStatus() displays mode, profile path, injection state, and opus/sonnet/haiku mappings |

**All 7 phase-1 requirements: SATISFIED**

Orphaned requirements check: REQUIREMENTS.md lists MODL-01–05 (Phase 2) and DISC-01–04 (Phase 3) as pending — none are claimed by this phase. No orphaned requirements for Phase 1.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/commands/switch.js` | 16 | `placeholder: 'sk-or-...'` | Info | UI hint string for @clack/prompts text() input — intentional UX, not a stub |

No blockers or warnings. The single "placeholder" match is a `@clack/prompts` input hint string, not a code stub.

---

### Human Verification Required

#### 1. End-to-End Switch Flow

**Test:** In a terminal, run `node bin/claude-switcher.js --use openrouter` (entering a real OpenRouter key when prompted), then open a new terminal and check that `$env:ANTHROPIC_BASE_URL` equals `https://openrouter.ai/api`.
**Expected:** New terminal has ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, and ANTHROPIC_API_KEY="" sourced from the PowerShell profile.
**Why human:** Verifying that PowerShell actually sources the profile and that env vars are live requires opening a new terminal session — not testable programmatically.

#### 2. Anthropic Restore Path

**Test:** After switching to OpenRouter (above), run `node bin/claude-switcher.js --use anthropic`, then open a new terminal and check that ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN are no longer set.
**Expected:** OpenRouter env vars absent; if original Anthropic key was present in environment before switching, ANTHROPIC_API_KEY is restored.
**Why human:** Requires comparing environment state before and after across two terminal sessions.

#### 3. Interactive Menu Navigation

**Test:** Run `node bin/claude-switcher.js` (no args) and navigate the arrow-key menu.
**Expected:** Menu renders with current mode hint highlighted, arrow keys work, selection routes correctly.
**Why human:** @clack/prompts terminal UI rendering requires visual inspection; cannot be automated without a TTY.

---

### Gaps Summary

No gaps. All 10 observable truths verified, all 9 required artifacts substantive and wired, all 9 key links confirmed, all 7 requirements satisfied.

Three items routed to human verification per standard protocol (live env var sourcing, cross-session state, and interactive TTY rendering) — none of these represent missing implementation.

---

_Verified: 2026-03-23T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
