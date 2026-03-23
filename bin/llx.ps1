# llx.ps1 — Launch Claude Code using only ANTHROPIC_API_KEY, bypassing claude.ai session token conflicts.
#
# How it works: CLAUDE_CONFIG_DIR is set to a separate, clean directory (~\.claude-api-only)
# that contains no session token. Claude Code then authenticates via ANTHROPIC_API_KEY only.
# The active model (when using OpenRouter) is written to ~\.claude-api-only\settings.json
# by claude-switcher, so Claude picks it up automatically from its own config.

$LlxConfigDir = "$env:USERPROFILE\.claude-api-only"
New-Item -ItemType Directory -Force -Path $LlxConfigDir | Out-Null
$env:CLAUDE_CONFIG_DIR = $LlxConfigDir

# Find the actual claude executable on PATH (bypasses any claude function wrapper in the profile)
$claudeExe = (Get-Command claude -CommandType Application -ErrorAction SilentlyContinue).Source
if (-not $claudeExe) { $claudeExe = "claude" }

& $claudeExe @args
