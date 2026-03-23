# llx.ps1 — Launch Claude Code using only ANTHROPIC_API_KEY, bypassing claude.ai session token conflicts.
#
# How it works: CLAUDE_CONFIG_DIR is set to a separate, clean directory (~\.claude-api-only)
# that contains no session token. Claude Code then authenticates via ANTHROPIC_API_KEY only.
# All other environment variables (including ANTHROPIC_API_KEY) are passed through unchanged.

$LlxConfigDir = "$env:USERPROFILE\.claude-api-only"
New-Item -ItemType Directory -Force -Path $LlxConfigDir | Out-Null
$env:CLAUDE_CONFIG_DIR = $LlxConfigDir
claude @args
