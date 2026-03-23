---
phase: 01-core-switching-cli
plan: 02
subsystem: cli
tags: [commander, clack-prompts, chalk, keychain, shell-profile, openrouter, anthropic]

# Dependency graph
requires:
  - phase: 01-core-switching-cli-plan-01
    provides: config.js, keychain.js, profile.js foundation modules

provides:
  - bin/claude-switcher.js shebang entry point
  - lib/cli.js Commander-based routing with --use and --status flags
  - lib/commands/switch.js switchTo() with keychain and profile injection
  - lib/commands/status.js showStatus() with mode and model display
  - lib/commands/menu.js runMenu() interactive @clack/prompts menu

affects:
  - phase-02-model-configuration (consumes --use and menu commands)
  - phase-03-model-discovery (consumes status display and menu framework)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Static ESM imports in cli.js for all three command modules (menu.js must exist at startup)
    - Commander option routing with try/catch error handler and process.exit(1)
    - @clack/prompts p.select() with current-mode hint for interactive navigation
    - chalk.green/cyan for success/mode coloring, chalk.yellow for warnings

key-files:
  created:
    - bin/claude-switcher.js
    - lib/cli.js
    - lib/commands/switch.js
    - lib/commands/status.js
    - lib/commands/menu.js
  modified: []

key-decisions:
  - "Created menu.js alongside Task 1 files (not as stub) because ESM static imports require all modules to exist at startup — would error even for --status if menu.js missing"

patterns-established:
  - "Pattern: All command modules must be created before CLI entry point can function — ESM static imports are resolved at load time"
  - "Pattern: switchTo('anthropic') uses injectBlock with restore block (not removeBlock) when an Anthropic key exists, so the block transitions rather than disappears"

requirements-completed: [SWIT-01, SWIT-02, SWIT-03, SWIT-04, CLI-01, CLI-02, CLI-03]

# Metrics
duration: 8min
completed: 2026-03-23
---

# Phase 01 Plan 02: CLI Entry Point and Command Modules Summary

**Commander CLI with switchTo()/showStatus()/runMenu() wiring keychain + shell profile injection for one-command Anthropic/OpenRouter switching**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-23T11:42:52Z
- **Completed:** 2026-03-23T11:51:00Z
- **Tasks:** 2 of 2 auto-tasks complete (Task 3 is human-verify checkpoint)
- **Files modified:** 5 created

## Accomplishments

- CLI entry point `bin/claude-switcher.js` with shebang, wires to `lib/cli.js`
- `lib/commands/switch.js` — full OpenRouter and Anthropic switching with keychain prompt on first run, Anthropic key preservation, and profile injection/removal
- `lib/commands/status.js` — displays current mode (colored), profile path, injection state, and all model tier mappings
- `lib/cli.js` — Commander program with `--use <provider>` and `--status` flags, routing to correct command handlers
- `lib/commands/menu.js` — @clack/prompts interactive select menu with current-mode hints and full routing

## Task Commits

Each task was committed atomically:

1. **Task 1: Switch command, status command, and CLI entry point** - `0fe3a68` (feat)
2. **Task 2: Interactive menu command** - `aea2612` (feat)
3. **Bug fix: PowerShell profile injection wrong shell version** - `17ceefd` (fix)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `bin/claude-switcher.js` - Shebang entry point, calls `run()` from lib/cli.js
- `lib/cli.js` - Commander program setup, routes --use/--status/no-args to command modules
- `lib/commands/switch.js` - switchTo() handles OpenRouter (keychain prompt + profile inject) and Anthropic (profile remove/restore)
- `lib/commands/status.js` - showStatus() prints mode, profile path, injection state, and model mappings
- `lib/commands/menu.js` - runMenu() @clack/prompts select with 4 options, hints for current mode

## Decisions Made

- Created `menu.js` as full implementation alongside Task 1 rather than as a stub — ESM static imports in `cli.js` resolve all modules at startup, so `menu.js` must exist for `--status` to work even though menu.js isn't called

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created menu.js concurrently with Task 1 files**
- **Found during:** Task 1 verification
- **Issue:** `cli.js` uses static `import { runMenu } from './commands/menu.js'` — Node.js ESM resolves all static imports at module load time, so running `--status` crashed with ERR_MODULE_NOT_FOUND for menu.js even though menu was never called
- **Fix:** Created the full menu.js implementation as part of Task 1 verification, then committed it with Task 2's commit. Functionally this means both tasks are delivered atomically but committed in correct order
- **Files modified:** lib/commands/menu.js
- **Verification:** `node -e "import('./lib/commands/menu.js').then(m => { console.log('MENU OK'); })"` prints MENU OK
- **Committed in:** aea2612 (Task 2 commit)

---

**2. [Rule 1 - Bug] Fixed PowerShell profile injection writing to wrong shell version's profile**
- **Found during:** Task 3 (human-verify checkpoint)
- **Issue:** `getProfilePath()` called `powershell -Command "echo $PROFILE"` — bash expanded `$PROFILE` to empty string before PowerShell received it, causing PowerShell to error. The catch block silently fell back to the hardcoded Windows PowerShell 5.1 path (`WindowsPowerShell/`) rather than the PowerShell 7 path (`PowerShell/`). Users running PS7 terminals saw an empty `$PROFILE` because the injection was written to the PS5.1 profile file instead.
- **Fix:** Changed command to use JS template literal trick `"Write-Output ${"$"}PROFILE"` so bash never sees the `$` but PowerShell receives the literal `$PROFILE` variable. Also made the function try `pwsh` (PS7) first, then fall back to `powershell.exe` (PS5.1), since modern Windows users typically run PS7 terminals.
- **Files modified:** lib/profile.js
- **Verification:** `node -e "import('./lib/profile.js').then(m => console.log(m.getProfilePath()))"` returns `d:\Documents\PowerShell\Microsoft.PowerShell_profile.ps1` (PS7 path); `--status` shows "Profile injected: Yes" after re-running `--use openrouter`
- **Committed in:** `17ceefd` (post-checkpoint fix commit)

---

**Total deviations:** 2 auto-fixed (1 blocking — module resolution, 1 bug — wrong PS profile path)
**Impact on plan:** Both fixes required for correctness. No scope creep.

## Issues Encountered

- ESM static imports cause all imports to resolve at startup — `--status` failed until `menu.js` existed. Fixed by creating the full menu.js implementation before Task 1 commit.
- PowerShell profile injection silently wrote to the wrong profile path (PS5.1 vs PS7). Discovered during human-verify checkpoint when user found empty `$PROFILE`. Fixed by using `pwsh` first and escaping `$PROFILE` to prevent bash expansion.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All CLI commands functional: `--status`, `--use openrouter`, `--use anthropic`, and interactive menu
- Awaiting human verification (Task 3 checkpoint) — user must test switching end-to-end
- Phase 2 (Model Configuration) can build on the `--use` switch flow and menu framework

---
*Phase: 01-core-switching-cli*
*Completed: 2026-03-23*
