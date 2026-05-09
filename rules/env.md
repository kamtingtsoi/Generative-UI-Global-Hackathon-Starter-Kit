# Environment & CLI Rules
> **AI Instruction:** When executing terminal commands, you must respect the system environment instructions below to ensure access to project binaries.

## Shell Environment
AI agents running automated terminal commands (like Antigravity) often execute in non-interactive/non-login shells, which means user-defined `$PATH` variables might be missing.

### Best Practices for Running Commands:
1. **Source Profile:** If a command (`npm`, `bun`, `gh`, `brew`) is not found, prepend your command with `source ~/.zshrc &&` (or `.bashrc`) to load the user's `$PATH`.
    * *Example:* `source ~/.zshrc && bun install`
2. **Path Fallbacks:** If the global binary still fails, check standard installation paths:
    * **Homebrew:** `/opt/homebrew/bin/` (Mac Silicon) or `/usr/local/bin/` (Intel).
    * **Node (NVM/FNM):** `~/.nvm/` or `~/.local/share/fnm/`.
    * **Bun:** `~/.bun/bin/`.
3. **Local Binaries First:** Always prefer executing project-local binaries via `npx`, `bunx`, or `./node_modules/.bin/` instead of assuming global binaries exist.
