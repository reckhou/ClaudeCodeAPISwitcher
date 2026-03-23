# Claude Code API Switcher

## What This Is

A CLI script that lets users toggle Claude Code between its native Anthropic API and OpenRouter's API. Users can map OpenRouter models to Claude's Opus/Sonnet/Haiku tiers and discover top programming models from OpenRouter's rankings — all without manually editing config files or environment variables.

## Core Value

One command to switch Claude Code between Anthropic and OpenRouter, with the right model pre-configured for each tier.

## Requirements

### Validated

- [x] Toggle Claude Code between vanilla Anthropic API and OpenRouter API — Validated in Phase 1: Core Switching & CLI
- [x] Map OpenRouter models to each Claude tier (Opus, Sonnet, Haiku) — Validated in Phase 2: Model Configuration
- [x] Persist configuration across sessions — Validated in Phase 2: Model Configuration

### Active

- [ ] Fetch and cache top 10 programming models from OpenRouter rankings as recommendations

### Out of Scope

- GUI/web interface — CLI is sufficient for this tool
- Supporting other API providers beyond Anthropic and OpenRouter — not needed for v1
- Auto-updating rankings on a schedule — manual refresh is enough

## Context

- Claude Code uses environment variables (`ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`) and model settings to connect to its API
- OpenRouter provides an OpenAI-compatible API at `https://openrouter.ai/api/v1` with hundreds of models
- Rankings source: `https://openrouter.ai/rankings#categories` (programming category, most recent)
- The tool needs to handle both the API endpoint redirect and model name remapping

## Constraints

- **Runtime**: Node.js — matches Claude Code's own tooling ecosystem
- **Distribution**: Single script or small package, easy to run/install globally
- **Compatibility**: Must work on Windows, macOS, Linux (cross-platform shell env management)
- **No side effects**: Switching should be reversible; easy to restore vanilla Claude Code state

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Node.js runtime | Matches Claude Code ecosystem, great JSON/API handling | ESM module type required; keytar-sync used |
| Config persistence via JSON file | Simple, readable, portable | Implemented via `conf` package |
| OpenRouter base URL `https://openrouter.ai/api` | No /v1 suffix — critical for Claude Code compatibility | Confirmed in Phase 1 |
| ANTHROPIC_AUTH_TOKEN receives OpenRouter key | ANTHROPIC_API_KEY must be empty string, not omitted | Confirmed in Phase 1 |
| `--set-opus/sonnet/haiku` flags for model assignment | CLI-first UX matching existing `--use`/`--status` pattern | Implemented in Phase 2 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after Phase 2 (Model Configuration) complete*
