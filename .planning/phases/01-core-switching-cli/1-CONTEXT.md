# Phase 1: Core Switching & CLI - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Working switcher that toggles Claude Code between its native Anthropic API and OpenRouter's API, with a usable CLI interface. Phase delivers: config management, shell profile injection for env vars, status display, interactive menu, and direct flags. Model tier mapping and model discovery are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Switching mechanism
- **D-01:** Switch by injecting `ANTHROPIC_BASE_URL` and `ANTHROPIC_API_KEY` into the user's shell profile
- **D-02:** Auto-detect shell: write to PowerShell `$PROFILE` on Windows (`$env:VAR = "value"` syntax), write to `~/.zshrc` or `~/.bashrc` on macOS/Linux (`export VAR=value` syntax)
- **D-03:** Switching to OpenRouter sets `ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1` and swaps the API key; switching back to Anthropic removes/restores the original values
- **D-04:** Changes take effect in new terminal sessions (env var injection approach — no wrapper script required)

### Invocation / distribution
- **D-05:** Distributed as an npm package installed globally from the GitHub repo: `npm install -g github:user/ClaudeCodeAPISwitcher`
- **D-06:** Exposes a global `claude-switcher` command (defined in `bin` in package.json)
- **D-07:** No npm registry account needed — installs directly from GitHub, compatible with private repos

### API key storage
- **D-08:** Use OS native keychain via `keytar` package — Windows Credential Manager, macOS Keychain, Linux Secret Service
- **D-09:** First run prompts the user for their OpenRouter API key and saves it to the keychain
- **D-10:** Original Anthropic API key (if set) is also stored in the keychain on first switch, so it can be restored cleanly

### CLI UX
- **D-11:** Running `claude-switcher` with no arguments launches an interactive menu (arrow-key navigation via `inquirer` or equivalent)
- **D-12:** Direct flags also supported for scripting: `--use openrouter`, `--use anthropic`, `--status`
- **D-13:** `--status` (or `claude-switcher status`) shows current mode and all tier→model mappings at a glance

### Claude's Discretion
- Exact interactive menu library (inquirer vs clack vs prompts — pick best fit for Node.js + Windows compatibility)
- Error message wording
- Color/styling in terminal output
- Exact config file schema beyond key fields

</decisions>

<specifics>
## Specific Ideas

- User is on Windows with PowerShell as primary shell — PowerShell profile support is required, not optional
- Cross-platform support expected: PowerShell profile (`$PROFILE`) for Windows, `~/.zshrc`/`~/.bashrc` for macOS/Linux
- Tool is installed from GitHub directly — no npm registry publishing needed
- OS keychain chosen for API key security (not plaintext config file)

</specifics>

<canonical_refs>
## Canonical References

No external specs yet — requirements are fully captured in decisions above and in:
- `.planning/REQUIREMENTS.md` — SWIT-01 through SWIT-04, CLI-01 through CLI-03
- `.planning/ROADMAP.md` §Phase 1 — Phase boundary and done criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- None yet — first phase sets the patterns

### Integration Points
- Shell profiles: `$PROFILE` (PowerShell), `~/.zshrc`, `~/.bashrc`
- OS keychain: via `keytar` npm package
- Claude Code reads `ANTHROPIC_BASE_URL` and `ANTHROPIC_API_KEY` from env at startup

</code_context>

<deferred>
## Deferred Ideas

- Per-project API config override — v2 requirement, not in scope for v1
- Multiple named profiles (e.g., "work", "personal") — v2 requirement
- Model selection UI — Phase 2

</deferred>

---

*Phase: 01-core-switching-cli*
*Context gathered: 2026-03-23*
