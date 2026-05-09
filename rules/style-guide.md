# Coding Style & Standards
> **AI Instruction:** Write all code adhering strictly to these rules. Do not debate these rules.

## Formatting & Readability
- **Length:** Keep functions short and focused on a single responsibility.
- **Naming:** 
    - Variables/Functions: `camelCase` (or `snake_case` depending on language norm)
    - Classes/Interfaces: `PascalCase`
    - Constants: `UPPER_SNAKE_CASE`
- **Explicitness:** Prioritize explicit, highly-readable variable names over terse abbreviations (e.g., use `userAccountData` instead of `uad`).

## Error Handling
- Do not silently swallow exceptions.
- If an error is caught and ignored, it *must* have a comment explaining why it is safe to ignore.
- Use explicit return types or standard Result/Option patterns if the language supports them, rather than relying solely on throwing exceptions for expected control flow.

## Comments & Documentation
- **"Why" over "What":** Code tells you *what* it does. Comments must explain *why* it does it.
- **Docstrings:** All publicly exported functions and classes must have a brief docstring outlining their inputs, outputs, and any side effects.

## Testing Guidelines
- Write "black-box" tests against the public API of the module.
- Do not export private or internal functions solely for the sake of unit testing them.
- Ensure any mocked data structurally matches the exact shape of production data.
