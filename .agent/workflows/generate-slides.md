---
description: Workflow for testing slide generation with specific configurations
---

# Generate Slides Workflow

This workflow describes how to generate slides to verify design changes or test new configurations.

## 1. Prepare Input
1.  **Select Input Markdown**:
    *   Use `examples/sample-slides.md` for general testing.
    *   Create a minimal reproduction markdown file if testing a specific feature (e.g., auto-pagination, specific component styling).

## 2. Select Configuration
1.  **Corporate Config**:
    *   Target `corporate-config.yaml` for the main configuration.
    *   To test a specific palette, identify the palette name (e.g., `fujifilm`, `toyota`).

## 3. Execution
1.  **Run Build Command**:
    ```bash
    # Basic build (PDF)
    npm start -- build examples/sample-slides.md

    # Build with specific palette
    npm start -- build examples/sample-slides.md --palette toyota

    # Build as PPTX
    npm start -- build examples/sample-slides.md --output dist/slides.pptx
    ```

## 4. Verification
1.  **Visual Inspection**:
    *   Open the generated PDF/PPTX.
    *   Check:
        *   **Cover Page**: Is the title/subtitle correct? Is the background applied?
        *   **Headers/Footers**: Are they aligned? Is the page number correct?
        *   **Colors**: Do they match the expected palette?
        *   **Fonts**: key fonts (e.g., YuGothic) rendered correctly?
