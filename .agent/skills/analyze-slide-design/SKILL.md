---
name: analyze-slide-design
description: Extracts design data (colors, fonts, layout) and renders key pages from a PDF presentation for analysis.
---

# Analyze Slide Design Skill

This skill helps you reverse-engineer the design of a corporate presentation PDF. It provides tools to extraction quantitative data (colors, fonts) and visual samples (images).

## Prerequisites
*   Python 3.x
*   `PyMuPDF` library: `pip install pymupdf`

## Tools

### 1. `extract_design.py`
Extracts global statistics about fonts and colors used in the PDF.

**Usage:**
```bash
python .agent/skills/analyze-slide-design/scripts/extract_design.py <path-to-pdf>
```

**Output:**
*   Page size
*   Most common colors (Hex codes)
*   Most common fonts
*   Background shape analysis

### 2. `render_pages.py`
Renders key pages (start, end, and samples throughout) as PNG images for visual inspection.

**Usage:**
```bash
python .agent/skills/analyze-slide-design/scripts/render_pages.py <path-to-pdf> --output <output-dir>
```

## Workflow Integration
This skill is primarily used in the `add-design-pattern` workflow.

1.  Run `extract_design.py` to get the base palette and typography.
2.  Run `render_pages.py` to generate visual references.
3.  Use the `vision` capabilities (if available) or manual inspection of the generated PNGs to understand:
    *   Logo placement
    *   Header/Footer layout
    *   Grid system
    *   Usage of the color palette (which is primary? which is accent?)
