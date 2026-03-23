# Phase 2: Model Configuration - Research

**Researched:** 2026-03-23
**Domain:** Node.js CLI — OpenRouter API validation, @clack/prompts interactive menus, Commander.js flags
**Confidence:** HIGH

## Summary

Phase 2 builds on a fully established Phase 1 codebase. All persistence infrastructure (`lib/config.js`), key storage (`lib/keychain.js`), and interactive prompt tooling (`@clack/prompts`) are already in place. The primary new work is: (1) a `lib/commands/models.js` module containing the model assignment logic and interactive sub-menu, (2) extending `lib/cli.js` with three new flags, and (3) adding a "Configure models" option to `lib/commands/menu.js`.

The critical technical work in this phase is making an authenticated HTTP call to `GET https://openrouter.ai/api/v1/models` and checking whether a user-supplied model ID appears in the `data[].id` field of the response. Node.js 18+ has built-in `fetch`, so no HTTP library is needed. The OpenRouter API requires a `Bearer` token in the `Authorization` header.

The "key prompt fallback" (D-06) reuses the identical pattern already established in `lib/commands/switch.js` — prompt with `p.text`, validate non-empty, save via `saveOpenRouterKey`. This pattern is copy-paste reuse.

**Primary recommendation:** Create `lib/commands/models.js` as the single new module containing all model assignment logic, a `validateModelId(modelId, apiKey)` helper, and the interactive sub-menu. Wire it into the existing menu and CLI entry points with minimal changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Show numbered recommendations list if Phase 3 cache exists (`.planning` or config dir cache), always offer free-text entry as an option below the list
- **D-02:** If no cache exists yet, show free-text input only (no error, no blocking)
- **D-03:** Apply to all three tiers (opus, sonnet, haiku) using the same input component
- **D-04:** Validate the entered model ID against OpenRouter's API: `GET https://openrouter.ai/api/v1/models` with `Authorization: Bearer <key>`
- **D-05:** Use the stored OpenRouter key from the OS keychain (keytar-sync) for the auth header
- **D-06:** If no key is stored yet, prompt the user for it on the spot (same flow as `--use openrouter`) and store it before proceeding with validation
- **D-07:** If the model ID is not found in the API response, show an error and re-prompt — do not save an invalid model
- **D-08:** Add "Configure models" as a new option in the existing Phase 1 interactive menu (`lib/commands/menu.js`)
- **D-09:** Selecting "Configure models" opens a sub-menu listing the three tiers with their current assignments; user picks a tier to reassign
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

### Deferred Ideas (OUT OF SCOPE)
- Bulk model assignment (set all three tiers at once) — not in scope for v1
- Clear/unset a model assignment — not required by MODL requirements, defer
- Phase 3 cache integration details — Phase 3 defines the cache format and location
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MODL-01 | User can assign an OpenRouter model to the Opus tier | `setModel('opus', id)` already in config.js; new models.js handles input + validation |
| MODL-02 | User can assign an OpenRouter model to the Sonnet tier | Same shared assignment function with tier parameter |
| MODL-03 | User can assign an OpenRouter model to the Haiku tier | Same shared assignment function with tier parameter |
| MODL-04 | Current tier→model mappings are displayed | `status.js` already renders this; sub-menu also shows current values per D-09 |
| MODL-05 | Model assignments persist in config file | `conf` library already persists via `setModel` — no new work required |
</phase_requirements>

## Standard Stack

### Core (already installed — no new installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@clack/prompts` | 1.1.0 | Interactive prompts, spinner, select, text | Already used in project; consistent UX |
| `chalk` | 5.6.2 | Colored terminal output | Already used throughout |
| `commander` | 14.0.3 | CLI flag parsing | Already used in `lib/cli.js` |
| `conf` | 15.1.0 | Config persistence | Already handles `setModel` / `getModels` |
| `keytar-sync` | 7.9.1 | OS keychain access | Already handles OpenRouter key storage/retrieval |
| Node.js `fetch` | built-in (Node 18+) | HTTP call to OpenRouter models endpoint | No external HTTP library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in `fetch` | `axios`, `node-fetch` | Built-in is sufficient for a single GET; adding a dependency is unnecessary overhead |

**Installation:** No new packages required. All dependencies are present from Phase 1.

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── commands/
│   ├── menu.js        # MODIFIED — add "Configure models" option + import models.js
│   ├── models.js      # NEW — model assignment logic, sub-menu, validateModelId helper
│   ├── status.js      # UNCHANGED — already displays tier→model table
│   └── switch.js      # UNCHANGED
├── cli.js             # MODIFIED — add --set-opus, --set-sonnet, --set-haiku options
├── config.js          # UNCHANGED — setModel/getModels already work
└── keychain.js        # UNCHANGED — getOpenRouterKey/saveOpenRouterKey already work
```

### Pattern 1: Shared Assignment Function (one function, tier parameter)
**What:** A single `assignModel(tier)` async function in `lib/commands/models.js` that handles the complete flow for any tier — key retrieval, optional key prompt, model input (free-text or from cache), validation, and persistence.
**When to use:** Called from both the interactive sub-menu and from flag handlers.
**Example:**
```javascript
// lib/commands/models.js
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { getOpenRouterKey, saveOpenRouterKey } from '../keychain.js';
import { setModel, getModels } from '../config.js';

export async function assignModel(tier) {
  // 1. Get or prompt for API key
  let apiKey = await getOpenRouterKey();
  if (!apiKey) {
    const key = await p.text({
      message: 'Enter your OpenRouter API key:',
      placeholder: 'sk-or-...',
      validate(value) {
        if (!value || value.trim().length === 0) return 'API key cannot be empty.';
      },
    });
    if (p.isCancel(key)) { p.cancel('Cancelled.'); process.exit(0); }
    apiKey = key.trim();
    await saveOpenRouterKey(apiKey);
  }

  // 2. Prompt for model ID (free-text; Phase 3 extends this with recommendations)
  const modelId = await p.text({
    message: `Enter model ID for ${tier} tier:`,
    placeholder: 'anthropic/claude-3-opus',
    validate(value) {
      if (!value || value.trim().length === 0) return 'Model ID cannot be empty.';
    },
  });
  if (p.isCancel(modelId)) { p.cancel('Cancelled.'); return; }

  // 3. Validate against OpenRouter API with spinner
  const valid = await validateModelId(modelId.trim(), apiKey);
  if (!valid) {
    p.log.error(chalk.red(`Model "${modelId.trim()}" not found in OpenRouter. Check the ID and try again.`));
    return; // Re-prompt is handled by caller loop
  }

  // 4. Persist
  setModel(tier, modelId.trim());
  p.log.success(chalk.green(`${tier} tier set to: ${modelId.trim()}`));
}
```

### Pattern 2: OpenRouter Model ID Validation
**What:** An async helper that fetches `/api/v1/models` and checks whether the supplied ID exists in `data[].id`.
**When to use:** Called from `assignModel()` and from flag handlers.
**Example:**
```javascript
// Source: https://openrouter.ai/docs/api/api-reference/models/get-models
export async function validateModelId(modelId, apiKey) {
  const s = p.spinner();
  s.start('Validating model ID with OpenRouter...');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      s.stop(chalk.red('OpenRouter API request failed.'));
      return false;
    }
    const { data } = await res.json();
    const valid = data.some((m) => m.id === modelId);
    s.stop(valid ? 'Model ID validated.' : chalk.red('Model ID not found.'));
    return valid;
  } catch (err) {
    s.stop(chalk.red('Network error during validation.'));
    return false;
  }
}
```

### Pattern 3: Re-prompt Loop for Invalid Input
**What:** Wrap the `assignModel` call in a `while (true)` loop, break on success, continue on validation failure. Used in both interactive sub-menu and flag handlers.
**When to use:** Both interactive sub-menu and `--set-*` flag handlers.
**Example:**
```javascript
// In the flag handler or sub-menu action
while (true) {
  const result = await assignModelWithReturn(tier); // returns true on success
  if (result) break;
}
```

### Pattern 4: CLI Flag Registration (Commander.js)
**What:** Add three `.option()` calls to the existing commander program in `lib/cli.js`.
**When to use:** Following D-12, consistent with existing `--use` / `--status` pattern.
**Example:**
```javascript
// lib/cli.js — add alongside existing .option() calls
program
  .option('--set-opus <model-id>', 'Assign OpenRouter model to Opus tier')
  .option('--set-sonnet <model-id>', 'Assign OpenRouter model to Sonnet tier')
  .option('--set-haiku <model-id>', 'Assign OpenRouter model to Haiku tier');

// In the opts handling block:
if (opts.setOpus) {
  await assignModelByFlag('opus', opts.setOpus);
} else if (opts.setSonnet) {
  await assignModelByFlag('sonnet', opts.setSonnet);
} else if (opts.setHaiku) {
  await assignModelByFlag('haiku', opts.setHaiku);
}
```
Note: Commander converts `--set-opus` to `opts.setOpus` (camelCase).

### Pattern 5: Sub-menu with Current Values (D-09)
**What:** `p.select` listing all three tiers with their current model assignment shown as the hint/label detail.
**Example:**
```javascript
// lib/commands/models.js — runModelsMenu()
export async function runModelsMenu() {
  const models = getModels();
  const tier = await p.select({
    message: 'Select a tier to configure:',
    options: [
      { value: 'opus',   label: 'Opus',   hint: models.opus   || '(not set)' },
      { value: 'sonnet', label: 'Sonnet', hint: models.sonnet || '(not set)' },
      { value: 'haiku',  label: 'Haiku',  hint: models.haiku  || '(not set)' },
      { value: 'back',   label: 'Back to main menu' },
    ],
  });
  if (p.isCancel(tier) || tier === 'back') return;
  // re-prompt loop
  let done = false;
  while (!done) {
    done = await assignModel(tier); // returns true on success, false on validation failure
  }
}
```

### Pattern 6: menu.js Integration (D-08)
**What:** Add one new option to the existing `p.select` in `runMenu()` and a new `case` in the switch.
**Example:**
```javascript
// lib/commands/menu.js — add to existing options array:
{ value: 'models', label: 'Configure models' },

// lib/commands/menu.js — add to existing switch(action):
case 'models':
  await runModelsMenu();
  break;
```

### Anti-Patterns to Avoid
- **Fetching the models list on every keystroke:** Fetch once per `assignModel()` call, cache the list in-memory for the duration of a single invocation.
- **Storing an unvalidated model ID:** Always validate before calling `setModel`. Never call `setModel` if `validateModelId` returns false.
- **Using `process.env` for the OpenRouter key:** Always use `getOpenRouterKey()` from keychain.js, not environment variables — these may not be set in the current shell session.
- **Importing new HTTP libraries:** Node 18+ `fetch` is sufficient. The project already enforces ESM and has no HTTP client dependency.
- **Commander option naming collision:** `--set-opus` becomes `opts.setOpus` in camelCase. Do not use `opts['set-opus']`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config persistence | Custom JSON file read/write | `conf` via `setModel()`/`getModels()` (already works) | Handles atomic writes, schema validation, platform paths |
| Keychain access | Env var or plain-text file | `keytar-sync` via `getOpenRouterKey()` (already works) | Secure OS keychain; already integrated |
| Spinner during network call | Custom `setInterval` animation | `p.spinner()` from `@clack/prompts` | Already installed; consistent with project UX |
| Interactive prompts | `readline` or custom prompt | `p.text`, `p.select`, `p.isCancel` from `@clack/prompts` | Already used in switch.js; identical pattern |
| Model ID format validation | Regex on `provider/model-name` | Full API validation via `GET /api/v1/models` (D-04) | A regex would silently accept non-existent IDs; API is authoritative |

**Key insight:** Every infrastructure concern (persistence, keychain, prompts, CLI parsing) is already solved. Phase 2 is purely new feature logic on top of established foundations.

## Common Pitfalls

### Pitfall 1: `@clack/prompts` spinner blocks if not stopped on error path
**What goes wrong:** If `fetch` throws (network error) and the spinner is never stopped, the terminal cursor stays hidden and the spinner keeps animating.
**Why it happens:** `p.spinner()` modifies terminal state; errors in the try block skip the stop call.
**How to avoid:** Always call `s.stop(message)` in the `catch` block, not just in the success path. Use try/finally if needed.
**Warning signs:** Terminal appears frozen after a network error; spinner never resolves.

### Pitfall 2: Commander camelCases hyphenated flag names
**What goes wrong:** Code checks `opts['set-opus']` but Commander stores it as `opts.setOpus`.
**Why it happens:** Commander automatically converts kebab-case option names to camelCase in the opts object.
**How to avoid:** Use `opts.setOpus`, `opts.setSonnet`, `opts.setHaiku`.
**Warning signs:** Flag is parsed without error but handler never fires.

### Pitfall 3: `fetch` response not checked before `.json()`
**What goes wrong:** A 401 (bad key) or 429 (rate limit) response still has a body, but it is an error object, not `{ data: [...] }`. Calling `.some()` on `data` crashes or returns false for the wrong reason.
**Why it happens:** `fetch` only rejects on network failure, not HTTP error status codes.
**How to avoid:** Check `res.ok` (or `res.status === 200`) before calling `res.json()`. Surface the HTTP status in the error message.
**Warning signs:** "Cannot read properties of undefined (reading 'some')" error during validation.

### Pitfall 4: Phase 3 cache dependency not handled gracefully (D-02)
**What goes wrong:** `models.js` tries to `import` or `require` a Phase 3 cache file/module that does not exist yet, throwing a module-not-found error at startup.
**Why it happens:** ESM static imports are evaluated at module load time, before any runtime checks.
**How to avoid:** Use dynamic `import()` inside the function body (not at the top of the file) when optionally loading Phase 3 cache, wrapped in try/catch. Or check for cache file existence with `fs.existsSync` before loading.
**Warning signs:** The CLI fails to start with "Cannot find module" even for commands that don't use the cache.

### Pitfall 5: Multiple consecutive flag options
**What goes wrong:** User supplies `--set-opus X --set-sonnet Y` in one command. The current `if/else if` chain only handles the first flag.
**Why it happens:** The opts block checks flags with early returns.
**How to avoid:** The requirements do not call for multi-flag support, but the implementation should at minimum not silently ignore extra flags. Either process all that are set, or document the single-flag constraint.
**Warning signs:** Second flag is silently ignored without error.

## Code Examples

### Full `validateModelId` helper (verified pattern)
```javascript
// Source: https://openrouter.ai/docs/api/api-reference/models/get-models
// Response structure: { data: [ { id: "anthropic/claude-3-opus", ... }, ... ] }
import * as p from '@clack/prompts';
import chalk from 'chalk';

export async function validateModelId(modelId, apiKey) {
  const s = p.spinner();
  s.start('Validating model ID with OpenRouter...');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      s.stop(chalk.red(`OpenRouter API error: ${res.status} ${res.statusText}`));
      return false;
    }
    const body = await res.json();
    const found = body.data.some((m) => m.id === modelId);
    if (found) {
      s.stop('Model ID is valid.');
    } else {
      s.stop(chalk.red(`Model "${modelId}" not found in OpenRouter model list.`));
    }
    return found;
  } catch (err) {
    s.stop(chalk.red(`Network error: ${err.message}`));
    return false;
  }
}
```

### Commander flag registration (existing pattern, extended)
```javascript
// lib/cli.js — add to existing program definition
program
  .option('--set-opus <model-id>', 'Assign OpenRouter model to Opus tier')
  .option('--set-sonnet <model-id>', 'Assign OpenRouter model to Sonnet tier')
  .option('--set-haiku <model-id>', 'Assign OpenRouter model to Haiku tier');

// opts object after parse: opts.setOpus, opts.setSonnet, opts.setHaiku
```

### Key prompt fallback (reuse from switch.js)
```javascript
// Identical pattern to switch.js lines 13-31
let apiKey = await getOpenRouterKey();
if (!apiKey) {
  const key = await p.text({
    message: 'Enter your OpenRouter API key:',
    placeholder: 'sk-or-...',
    validate(value) {
      if (!value || value.trim().length === 0) return 'API key cannot be empty.';
    },
  });
  if (p.isCancel(key)) { p.cancel('Cancelled.'); process.exit(0); }
  apiKey = key.trim();
  await saveOpenRouterKey(apiKey);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `node-fetch` for HTTP in Node.js | Built-in `fetch` (global) | Node 18 (2022) | No extra dependency; same API |
| `keytar` (archived) | `keytar-sync` | 2023 (project decision Phase 1) | Same API, maintained fork — use keytar-sync |

**Deprecated/outdated:**
- `keytar`: Archived, replaced by `keytar-sync` per STATE.md Phase 1 decision. Do not use.

## Open Questions

1. **Re-prompt loop scope: function return value or loop at call site?**
   - What we know: D-07 says "show error and re-prompt" without specifying whether the loop lives inside `assignModel` or at the call site.
   - What's unclear: If the loop is inside `assignModel`, exiting early (cancel) is more complex. If at the call site, each caller duplicates the loop.
   - Recommendation: Put the re-prompt loop at the call site (sub-menu and flag handler), keep `assignModel` as a single-attempt function that returns `true`/`false`. This keeps the function pure and reusable.

2. **Flag conflict behavior: `--set-opus` + `--set-sonnet` in one invocation**
   - What we know: Requirements don't mention multi-flag support. D-10 lists three separate flags.
   - What's unclear: Should both be applied, or should extra flags produce an error?
   - Recommendation: Process all three flags independently in sequence (check `if opts.setOpus`, then `if opts.setSonnet`, then `if opts.setHaiku`), not `else if`. This is simplest and most user-friendly for scripting.

3. **Phase 3 cache file path convention**
   - What we know: D-01/D-02 say to read cache if it exists, don't fail if absent. Phase 3 defines the format.
   - What's unclear: The cache path is TBD until Phase 3.
   - Recommendation: In Phase 2, write a `loadRecommendationsCache()` helper that returns `null` if the cache doesn't exist. Use a placeholder path constant that Phase 3 will define. This isolates the integration point.

## Environment Availability

Step 2.6: All external dependencies are the project's own installed packages and Node.js built-in `fetch`. No external services, databases, or additional CLI tools are required beyond what is already installed for Phase 1.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v25.8.1 | — |
| `@clack/prompts` | Interactive prompts | Yes | 1.1.0 | — |
| `chalk` | Output coloring | Yes | 5.6.2 | — |
| `commander` | Flag parsing | Yes | 14.0.3 | — |
| `conf` | Config persistence | Yes | 15.1.0 | — |
| `keytar-sync` | Keychain access | Yes | 7.9.1 | — |
| `fetch` (built-in) | OpenRouter API call | Yes | Node 18+ built-in | — |
| OpenRouter API | Model ID validation | Network-dependent | — | Skip validation when offline (not recommended — D-07 requires validation) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — all dependencies available.

## Validation Architecture

`nyquist_validation` is explicitly `false` in `.planning/config.json`. This section is skipped per configuration.

## Sources

### Primary (HIGH confidence)
- OpenRouter official docs: https://openrouter.ai/docs/api/api-reference/models/get-models — confirmed response structure `{ data: [ { id, name, ... } ] }`, authentication required (Bearer token)
- Project source files read directly: `lib/config.js`, `lib/keychain.js`, `lib/commands/menu.js`, `lib/commands/switch.js`, `lib/commands/status.js`, `lib/cli.js`, `package.json`
- `@clack/prompts` GitHub README (https://github.com/bombshell-dev/clack/blob/main/packages/prompts/README.md) — spinner API: `p.spinner()`, `.start(msg)`, `.stop(msg)`, `.message(msg)`

### Secondary (MEDIUM confidence)
- WebSearch result for OpenRouter models response format — confirmed `id` field is `provider/model-name` format (e.g. `anthropic/claude-3-opus`) — consistent with official docs fetch

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and in use; versions read from package.json directly
- Architecture: HIGH — patterns derived directly from existing Phase 1 source code; new module follows established conventions
- OpenRouter API: HIGH — official docs confirmed response structure
- Pitfalls: HIGH — derived from direct code inspection and known Commander.js/fetch behaviors

**Research date:** 2026-03-23
**Valid until:** 2026-05-23 (stable APIs; OpenRouter models endpoint format is unlikely to change)
