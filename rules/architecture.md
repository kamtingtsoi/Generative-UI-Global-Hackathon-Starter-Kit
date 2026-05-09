# Project Architecture Notes
> **AI Instruction:** All proposed solutions and code structures must align with the decisions documented here.

## 1. High-Level Paradigm
- **Paradigm:** [e.g., Object-Oriented / Functional / Actor Model / MVC]
- **State Management:** [How is state globally/locally managed? e.g., Redux, standard React Context, database truth]

## 2. Directory Structure
This outlines how standard features should be laid out in the codebase. Do not create new top-level directories without explicit permission from the user.

- `src/` (or equivalent root source directory): Core application logic.
    - `components/` (or `views/`): Pure presentation UI layers.
    - `services/` (or `api/`): All external integrations and data-fetching logic.
    - `utils/` (or `helpers/`): Pure, side-effect-free helper functions.
    - `types/`: Shared type definitions.

*(Update this section so the AI knows exactly where a new file belongs.)*

## 3. Data Flow
1. User interacts with `[Component layer]`.
2. This invokes `[Controller / Service / Action layer]`.
3. The data is mutated in `[Manager / Database]`.
4. State is propagated back via `[Mechanism]`.

## 4. Third-Party Integrations
- **[Integration 1]:** Handled in `[service path]`. Used for `[purpose]`.
- **[Integration 2]:** Handled in `[service path]`. Used for `[purpose]`.
