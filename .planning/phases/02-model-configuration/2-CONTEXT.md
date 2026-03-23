# Phase 2: Model Configuration - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can assign any OpenRouter model ID to each Claude tier (Opus/Sonnet/Haiku) and mappings persist. Phase delivers: `--set-opus`, `--set-sonnet`, `--set-haiku` flags, interactive model assignment sub-menu, OpenRouter API validation of model IDs, and integration of model config into the main interactive menu. Model discovery/ranking cache is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Model input UX
- **D-01:** Show numbered recommendations list if Phase 3 cache exists (`.planning` or config dir cache), always offer free-text entry as an option below the list
- **D-02:** If no cache exists yet, show free-text input only (no error, no blocking)
- **D-03:** Apply to all three tiers (opus, sonnet, haiku) using the same input component

### Model ID validation
- **D-04:** Validate the entered model ID against OpenRouter's API: `GET https://openrouter.ai/api/v1/models` with `Authorization: Bearer <key>`
- **D-05:** Use the stored OpenRouter key from the OS keychain (keytar-sync) for the auth header
- **D-06:** If no key is stored yet, prompt the user for it on the spot (same flow as `--use openrouter`) and store it before proceeding with validation
- **D-07:** If the model ID is not found in the API response, show an error and re-prompt — do not save an invalid model

### Main menu integration
- **D-08:** Add "Configure models" as a new option in the existing Phase 1 interactive menu (`lib/commands/menu.js`)
- **D-09:** Selecting "Configure models" opens a sub-menu listing the three tiers with their current assignments; user picks a tier to reassign

### Flag design
- **D-10:** Three explicit flags: `--set-opus <model-id>`, `--set-sonnet <model-id>`, `--set-haiku <model-id>`
- **D-11:** Flags follow the same validation flow (D-04 through D-07) as interactive assignment
- **D-12:** Flags are consistent with the existing `--use` / `--status` pattern in `lib/cli.js`

### Existing scaffolding (already built in Phase 1)
- `lib/config.js` exports `setModel(tier, modelId)` and `getModels()` — persistence is done, no changes needed
- `lib/commands/status.js` already displays tier→model mappings — no changes needed
- `@clack/prompts` already installed — use for all new interactive prompts
- `lib/keychain.js` already handles key storage/retrieval — reuse for API key access

### Claude's Discretion
- Exact spinner/loading UX during OpenRouter API validation call
- Error message wording for invalid model IDs
- Sub-menu layout details (how tiers + current values are displayed)

</decisions>

<specifics>
## Specific Ideas

- OpenRouter models list endpoint: `GET https://openrouter.ai/api/v1/models` — requires `Authorization: Bearer <key>` (confirmed from official docs)
- Model IDs follow `provider/model-name` format (e.g. `anthropic/claude-3-opus`, `openai/gpt-4o`)
- Phase 3 cache location TBD by Phase 3 — Phase 2 should read it if it exists but not fail if absent

</specifics>

<canonical_refs>
## Canonical References

- `.planning/REQUIREMENTS.md` — MODL-01 through MODL-05
- `.planning/ROADMAP.md` §Phase 2 — Phase boundary and done criteria
- `lib/config.js` — existing `setModel` / `getModels` API (read before implementing)
- `lib/keychain.js` — existing key retrieval API (read before implementing)
- `lib/commands/menu.js` — existing menu to extend with "Configure models" option
- `lib/cli.js` — existing commander setup to add new flags to

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/config.js`: `setModel(tier, modelId)`, `getModels()` — full persistence ready
- `lib/keychain.js`: `getOpenRouterKey()`, `saveOpenRouterKey()` — keychain access ready
- `lib/commands/status.js`: already renders tier→model table — no changes needed
- `@clack/prompts`: installed, used in switch.js — use same pattern for new prompts

### Established Patterns
- ESM imports throughout (`import ... from`)
- `@clack/prompts` for all interactive input (`p.text`, `p.select`, `p.isCancel`)
- `chalk` for colored output
- Async/await for all I/O operations

### Integration Points
- `lib/commands/menu.js` — add "Configure models" option, route to new sub-menu
- `lib/cli.js` — add `--set-opus`, `--set-sonnet`, `--set-haiku` options to commander
- New file needed: `lib/commands/models.js` — model assignment logic + interactive sub-menu

</code_context>

<deferred>
## Deferred Ideas

- Bulk model assignment (set all three tiers at once) — not in scope for v1
- Clear/unset a model assignment — not required by MODL requirements, defer
- Phase 3 cache integration details — Phase 3 defines the cache format and location

</deferred>

---

*Phase: 02-model-configuration*
*Context gathered: 2026-03-23*
