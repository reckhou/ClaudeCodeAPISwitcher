# Requirements: Claude Code API Switcher

**Defined:** 2026-03-23
**Core Value:** One command to switch Claude Code between Anthropic and OpenRouter, with the right model pre-configured for each tier.

## v1 Requirements

### Switching

- [x] **SWIT-01**: User can switch Claude Code to OpenRouter API mode
- [x] **SWIT-02**: User can switch Claude Code back to vanilla Anthropic API mode
- [x] **SWIT-03**: Current mode (Anthropic/OpenRouter) is clearly displayed
- [x] **SWIT-04**: Switch persists — Claude Code sessions started after switching use the correct API

### Model Configuration

- [x] **MODL-01**: User can assign an OpenRouter model to the Opus tier
- [x] **MODL-02**: User can assign an OpenRouter model to the Sonnet tier
- [x] **MODL-03**: User can assign an OpenRouter model to the Haiku tier
- [x] **MODL-04**: Current tier→model mappings are displayed
- [x] **MODL-05**: Model assignments persist in config file

### Model Discovery

- [ ] **DISC-01**: Tool fetches top programming models from OpenRouter rankings
- [ ] **DISC-02**: Top 10 models are saved/cached as recommendations
- [ ] **DISC-03**: Recommendations are shown when user is selecting a model for a tier
- [ ] **DISC-04**: User can manually refresh the cached rankings

### CLI Interface

- [x] **CLI-01**: Interactive menu mode for browsing and changing settings
- [x] **CLI-02**: Direct command flags for scripting (e.g. `--use openrouter`, `--set-sonnet <model>`)
- [x] **CLI-03**: Status command shows current mode and all tier mappings

## v2 Requirements

### Advanced

- **ADV-01**: Support for custom base URLs beyond OpenRouter
- **ADV-02**: Per-project API config (override global config from project directory)
- **ADV-03**: Multiple named profiles (e.g. "work", "personal")

## Out of Scope

| Feature | Reason |
|---------|--------|
| GUI / web interface | CLI is sufficient; adds unnecessary complexity |
| Other API providers (Groq, Together, etc.) | OpenRouter already aggregates these |
| Scheduled ranking auto-refresh | Manual refresh is enough for v1 |
| Windows registry / system-level env vars | Shell profile injection is simpler and reversible |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SWIT-01 | Phase 1 | Complete |
| SWIT-02 | Phase 1 | Complete |
| SWIT-03 | Phase 1 | Complete |
| SWIT-04 | Phase 1 | Complete |
| MODL-01 | Phase 2 | Complete |
| MODL-02 | Phase 2 | Complete |
| MODL-03 | Phase 2 | Complete |
| MODL-04 | Phase 2 | Complete |
| MODL-05 | Phase 2 | Complete |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |
| DISC-04 | Phase 3 | Pending |
| CLI-01 | Phase 1 | Complete |
| CLI-02 | Phase 1 | Complete |
| CLI-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after initial definition*
