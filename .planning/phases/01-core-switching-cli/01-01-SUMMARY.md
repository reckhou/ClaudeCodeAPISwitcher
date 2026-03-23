---
phase: 01-core-switching-cli
plan: 01
subsystem: infra
tags: [nodejs, esm, conf, keytar-sync, shell-profile, powershell, bash, zsh]

# Dependency graph
requires: []
provides:
  - package.json with ESM type, bin field, and all 5 runtime dependencies installed
  - lib/config.js - mode persistence via conf library (getMode, setMode, getModels, setModel)
  - lib/keychain.js - OS keychain access via keytar-sync (save/get Anthropic and OpenRouter keys)
  - lib/profile.js - shell profile detection, idempotent injection/removal, env var block builders
affects: [01-02, 02, 03]

# Tech tracking
tech-stack:
  added:
    - keytar-sync@7.9.1 (OS keychain - Windows Credential Manager, macOS Keychain, Linux Secret Service)
    - commander@14.0.3 (CLI flag parsing)
    - "@clack/prompts@1.1.0 (interactive menu)"
    - chalk@5.6.2 (terminal color output)
    - conf@15.1.0 (config file persistence, cross-platform paths)
  patterns:
    - ESM-only project ("type":"module" in package.json) — required for chalk v5, conf, @clack/prompts
    - Marker-block pattern for idempotent shell profile injection (# BEGIN/END claude-switcher)
    - Platform-branching in profile.js for win32 vs macOS/Linux syntax
    - Conf schema with enum validation for mode field

key-files:
  created:
    - package.json
    - package-lock.json
    - lib/config.js
    - lib/keychain.js
    - lib/profile.js
  modified: []

key-decisions:
  - "Use keytar-sync (maintained fork) instead of archived keytar — same API, actively patched"
  - "ESM module type required: chalk v5, conf, @clack/prompts are all pure ESM"
  - "OpenRouter base URL is https://openrouter.ai/api (no /v1 suffix) — critical for Claude Code compatibility"
  - "ANTHROPIC_API_KEY must be set to empty string (not omitted) when switching to OpenRouter"
  - "ANTHROPIC_AUTH_TOKEN (not ANTHROPIC_API_KEY) receives the OpenRouter key"
  - "writeProfile uses recursive:true mkdir to handle missing PowerShell profile directories"

patterns-established:
  - "Pattern: Marker block injection — wrap env vars in # BEGIN/END claude-switcher comment delimiters; idempotent replace-or-append"
  - "Pattern: Platform-branch in profile.js — os.platform() === 'win32' for PowerShell syntax, else bash/zsh export syntax"
  - "Pattern: conf schema validation — use enum and type constraints, not runtime checks, for mode values"

requirements-completed: [SWIT-01, SWIT-02, SWIT-04]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 1 Plan 1: Project Scaffold and Foundation Library Modules Summary

**ESM Node.js project scaffolded with conf-based config persistence, keytar-sync OS keychain access, and idempotent PowerShell/bash shell profile injection using marker-block pattern**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-23T11:41:37Z
- **Completed:** 2026-03-23T11:42:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created package.json as pure ESM with bin field, engines constraint, and all 5 runtime dependencies installed via npm
- Implemented lib/config.js using conf with schema validation for mode (anthropic/openrouter) and models (opus/sonnet/haiku)
- Implemented lib/keychain.js using keytar-sync for secure OS-level API key storage (Windows Credential Manager on this host)
- Implemented lib/profile.js with full platform-aware shell injection: detects PowerShell profile via live `powershell -NoProfile -Command "echo $PROFILE"` call, generates correct syntax per platform, injects/replaces/removes marker blocks idempotently

## Task Commits

Each task was committed atomically:

1. **Task 1: Project scaffold and config/keychain modules** - `43f0ab4` (feat)
2. **Task 2: Shell profile injection module** - `7b3b953` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `package.json` - ESM package with bin, engines, and 5 runtime dependencies
- `package-lock.json` - Lockfile for reproducible installs
- `lib/config.js` - Mode and model config persistence via conf; exports getMode, setMode, getModels, setModel
- `lib/keychain.js` - OS keychain wrapper via keytar-sync; exports save/get/delete for Anthropic and OpenRouter keys
- `lib/profile.js` - Shell profile detection, read/write, marker-block injection and removal, OpenRouter and Anthropic env var block builders

## Decisions Made

- Used keytar-sync v7.9.1 instead of the archived keytar package — API-identical maintained fork with prebuilt N-API binaries
- Project uses `"type": "module"` (ESM) because chalk v5, conf, and @clack/prompts are all pure ESM and would fail with CommonJS
- OpenRouter base URL hardcoded as `https://openrouter.ai/api` (no /v1) per OpenRouter's Anthropic-protocol documentation
- `ANTHROPIC_AUTH_TOKEN` carries the OpenRouter key; `ANTHROPIC_API_KEY` is explicitly set to empty string to prevent Claude Code's Anthropic fallback logic from activating
- `buildAnthropicRestoreBlock` returns null when apiKey is null/undefined — caller is expected to call `removeBlock` instead

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for these library modules. The CLI commands that consume these modules (Plan 02) will prompt users for API keys on first run.

## Next Phase Readiness

- All three library modules import without errors and are verified functional
- config.js round-trips mode values correctly via conf
- keychain.js exports are ready for CLI commands to call
- profile.js injection is idempotent, removal is clean, and platform detection works on this Windows host (resolves to `d:\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` via live PowerShell call)
- Plan 02 can immediately import from lib/config.js, lib/keychain.js, and lib/profile.js to build the CLI commands

---
*Phase: 01-core-switching-cli*
*Completed: 2026-03-23*
