# Requirements: Claude Code API Switcher

**Defined:** 2026-03-23
**Core Value:** One command to switch Claude Code between Anthropic and OpenRouter, with the right model pre-configured for each tier.

## v1 Requirements

### Switching

- [ ] **SWIT-01**: User can switch Claude Code to OpenRouter API mode
- [ ] **SWIT-02**: User can switch Claude Code back to vanilla Anthropic API mode
- [ ] **SWIT-03**: Current mode (Anthropic/OpenRouter) is clearly displayed
- [ ] **SWIT-04**: Switch persists — Claude Code sessions started after switching use the correct API

### Model Configuration

- [ ] **MODL-01**: User can assign an OpenRouter model to the Opus tier
- [ ] **MODL-02**: User can assign an OpenRouter model to the Sonnet tier
- [ ] **MODL-03**: User can assign an OpenRouter model to the Haiku tier
- [ ] **MODL-04**: Current tier→model mappings are displayed
- [ ] **MODL-05**: Model assignments persist in config file

### Model Discovery

- [ ] **DISC-01**: Tool fetches top programming models from OpenRouter rankings
- [ ] **DISC-02**: Top 10 models are saved/cached as recommendations
- [ ] **DISC-03**: Recommendations are shown when user is selecting a model for a tier
- [ ] **DISC-04**: User can manually refresh the cached rankings

### CLI Interface

- [ ] **CLI-01**: Interactive menu mode for browsing and changing settings
- [ ] **CLI-02**: Direct command flags for scripting (e.g. `--use openrouter`, `--set-sonnet <model>`)
- [ ] **CLI-03**: Status command shows current mode and all tier mappings

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
| SWIT-01 | Phase 1 | Pending |
| SWIT-02 | Phase 1 | Pending |
| SWIT-03 | Phase 1 | Pending |
| SWIT-04 | Phase 1 | Pending |
| MODL-01 | Phase 2 | Pending |
| MODL-02 | Phase 2 | Pending |
| MODL-03 | Phase 2 | Pending |
| MODL-04 | Phase 2 | Pending |
| MODL-05 | Phase 2 | Pending |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |
| DISC-04 | Phase 3 | Pending |
| CLI-01 | Phase 1 | Pending |
| CLI-02 | Phase 1 | Pending |
| CLI-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after initial definition*
