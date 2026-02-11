# AI Agent Guide for `markdown-to-slide-creator`

## Project Overview
`markdown-to-slide-creator` is a CLI tool that converts Markdown into high-quality, corporate-style presentation slides (PDF/PPTX) using [Marp](https://marp.app/).
The core value proposition is **design fidelity**—generating slides that look like they were manually created by a professional designer, adhering to specific corporate brand guidelines (currently FUJIFILM and TOYOTA).

## Key Architectural Principles
1.  **Config-Driven Design**: All visual styling is derived from `corporate-config.yaml`. Hardcoded styles in templates should be minimized; use the configuration.
2.  **Pipeline Architecture**:
    *   **Preprocessing**: Logic to inject Marp directives, handle auto-pagination, and detect sections.
    *   **Theme Generation**: Dynamic CSS generation using EJS templates based on the config.
    *   **Rendering**: Delegating the final output generation to `@marp-team/marp-cli`.
3.  **Type Safety**: Strict TypeScript usage. Zod for all runtime validation, especially for configuration loading.

## Coding Standards
*   **Language**: TypeScript 5.x (Strict mode).
*   **Style**: Prettier + ESLint.
*   **Testing**: Vitest. Unit tests for logic (preprocessors, config loader), integration tests for the full build pipeline.
*   **FileSystem**: Use `fs/promises` or purely synchronous `fs` methods depending on the context (CLI startup vs runtime).

## Design Philosophy
*   **Corporate Identity**: We prioritize exact color matching, font usage, and layout structures of target companies.
*   **Simplicity for Users**: Users should only need to write simple Markdown. The tool handles the complexity of layout classes, pagination, and headers/footers.

## Project Structure
*   `src/options.ts`: CLI option parsing (Commander).
*   `src/auth.ts`: Configuration loading (Zod).
*   `src/convert.ts`: Main logic glue.
*   `docs/design.md`: **Crucial**. Contains the source of truth for design patterns. Always refer to this when implementing new themes.
