---
description: Generates a slide deck from a topic or text input using the create-slide-deck skill and builds the PDF.
---

# Generate Slides from Input Workflow

This workflow automates the process of generating a slide deck from a user request.

## Steps

1.  **Analyze Request**:
    -   Identify the `topic` and `source_text` (if provided) from the user's input.
    -   Determine the desired `output_filename` (default to `slides.md` if not specified).

2.  **Generate Markdown**:
    -   Use the `create-slide-deck` skill found in `.agent/skills/create-slide-deck/SKILL.md`.
    -   Pass the `topic` and `source_text` as input to the skill.
    -   **Strictly follow** all layout rules defined in the skill.

3.  **Save File**:
    -   Save the generated Markdown content to the specified `output_filename`.

4.  **Build PDF**:
    -   Run the build command to generate the PDF.
    -   // turbo
    ```bash
    npx tsx src/index.ts build <output_filename>
    ```

5.  **Verify**:
    -   Check if the PDF was generated successfully.
    -   Report the location of the generated PDF to the user.
