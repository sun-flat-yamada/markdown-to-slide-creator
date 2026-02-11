---
description: Workflow for adding a new corporate design pattern (like FUJIFILM or TOYOTA)
---

# Adding a New Corporate Design Pattern

This workflow outlines the steps to analyze, document, and implement a new corporate design pattern for the slide creator.

## 1. Discovery & Analysis
1.  **Obtain Source Material**: Get a PDF of a recent IR presentation or brand guideline.
2.  **Extract Design Data**:
    *   Use the `analyze-slide-design` skill to extract colors, fonts, and layout geometry.
    *   Identify key slide types: Cover, Agenda, Section Divider, Content (Text/Chart), End.
3.  **Visual Analysis**:
    *   Render key pages to images.
    *   Note specific layout rules (e.g., "Logo is always top-right", "Title bar height is 12% of height").

## 2. Documentation
1.  **Update `docs/design.md`**:
    *   Create a new section (e.g., `## 9. 参考: SONY IR スライド デザイン分析`).
    *   Document the extracted color palette (Hex codes).
    *   Document typography usage.
    *   Describe the layout of each key slide type.
    *   Compare with existing patterns.
2.  **Define Configuration**:
    *   Draft the YAML configuration for the new palette in `docs/design.md` first.

## 3. Implementation
1.  **Update `corporate-config.yaml`**:
    *   Add the new palette definition under `colors.palettes`.
    *   Define gradients and specific color mappings.
2.  **Verify**:
    *   Generate a test slide deck using the new palette (`--palette <new-name>`).
    *   Visually compare the output against the original PDF.

## 4. Submission
1.  **Commit**: Create a feature branch (e.g., `feature/sony-ir-design`).
2.  **PR**: Submit a Pull Request referencing the analysis in `docs/design.md`.
