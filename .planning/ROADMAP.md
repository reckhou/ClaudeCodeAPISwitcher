# Roadmap: Claude Code API Switcher

**Created:** 2026-03-23
**Milestone:** v1.0 — Core switcher with model management and discovery

---

## Phase 1 — Core Switching & CLI

**Goal:** Working switcher that toggles Claude Code between Anthropic and OpenRouter APIs, with a usable CLI interface.

**Delivers:**
- Config file setup (store mode, API keys, model mappings)
- Switch between Anthropic and OpenRouter via env var injection
- Status display (current mode + tier mappings)
- Interactive menu + direct flag support

**Requirements covered:** SWIT-01, SWIT-02, SWIT-03, SWIT-04, CLI-01, CLI-02, CLI-03

**Done when:**
- `claude-switcher` (or `node switcher.js`) runs and shows current mode
- Running with `--use openrouter` switches API; `--use anthropic` restores it
- Starting a new Claude Code session uses the configured API

---

## Phase 2 — Model Configuration

**Goal:** Users can assign any OpenRouter model to each Claude tier (Opus/Sonnet/Haiku) and mappings persist.

**Delivers:**
- Interactive model selection per tier
- `--set-opus`, `--set-sonnet`, `--set-haiku` flags
- Config file stores and loads tier→model mappings
- Display current assignments in status output

**Requirements covered:** MODL-01, MODL-02, MODL-03, MODL-04, MODL-05

**Done when:**
- User can set any OpenRouter model string to each tier
- Mappings persist between script invocations
- Status command shows assigned models for each tier

---

## Phase 3 — Model Discovery & Recommendations

**Goal:** Fetch top programming models from OpenRouter rankings and surface them as recommendations when selecting models.

**Delivers:**
- Scrape/fetch `https://openrouter.ai/rankings#categories` programming category
- Cache top 10 models locally
- Show recommendations during tier assignment
- Manual refresh command

**Requirements covered:** DISC-01, DISC-02, DISC-03, DISC-04

**Done when:**
- `--refresh-rankings` fetches and caches top 10 programming models
- When setting a model tier, top 10 are shown as numbered options
- Cache is stored in config directory and survives script restarts

---

## Milestone: v1.0

All 3 phases complete. Claude Code API Switcher is fully functional with switching, model config, and discovery.
