---
name: create-slide-deck
description: Generates a corporate slide deck in Markdown format compatible with Marp and the slide-creator tool. Enforces strict layout, design, and content rules.
---

# Create Slide Deck

This skill generates a slide deck based on a provided topic or source text. The output is a Markdown file that follows specific structural and layout rules for the `slide-creator` tool.

## Input
- **Topic**: The main subject of the presentation.
- **Source Text** (Optional): Raw text or data to convert into slides.
- **Target Audience** (Optional): Who the presentation is for.

## Output
- A single Markdown file containing the slide content.
- NO front-matter (handled by the build tool).
- NO `theme:` or `paginate:` directives (handled by the build tool).

## Rules

### 1. Structure & Hierarchy
-   **Title Slide**: Use `#` for the main presentation title. Use `##` for the subtitle. (Only ONCE at the very beginning).
-   **Section Dividers**: Use `##` for section titles. This triggers an automatic section divider slide.
-   **content Slides**: Use `###` for individual slide titles.
-   **Slide Separator**: Use `---` to separate **every** slide.

### 2. Layout & Classes
Use `<!-- _class: CLASS_NAME -->` to apply layouts.

| Class Name | Description | HTML Structure Requirement |
| :--- | :--- | :--- |
| `cols-2` | Two-column layout | Wrap left column in `<div class="col">...</div>` and right in `<div class="col">...</div>`. |
| `cols-3` | Three-column layout | Wrap each column in `<div class="col">...</div>`. |
| `img-right` | Text Left, Image Right | Text in `<div class="col">...</div>`, Image as standard Markdown image `![alt](url)`. |
| `img-left` | Image Left, Text Right | Image first, then Text in `<div class="col">...</div>`. |
| `image-focus` | Full-screen image + Centered Text | Background image: `![bg](url)`. Text is centered automatically. |
| `hero` | Hero slide (Title + Tagline) | Background image `![bg](url)` or `bg-dark`. |
| `bg-dark` | Dark background, white text | No special HTML needed. |

### 3. Content Density
-   **Bullet Points**: Max 5-6 items per slide.
-   **Text Length**: Max 100 characters of body text per slide (excluding lists).
-   **One Message Per Slide**: Focus on a single key takeaway.

### 4. Visuals
-   **Mermaid**: Use `mermaid` code blocks for flowcharts and diagrams.
-   **Images**: Use local paths (e.g., `./assets/img.png`) or placeholders if specific images aren't provided.
-   **Icons**: Suggest icons where appropriate.

## Example Output

```markdown
# Project Apollo Update
## Q3 Progress Report

---

## Executive Summary

---

### Key Achievements
<!-- _class: cols-2 -->

<div class="col">

- **Launch Success**: Successfully deployed v1.0
- **User Growth**: +15% MoM
- **Stability**: 99.9% Uptime

</div>

<div class="col">

![Growth Chart](./assets/chart_placeholder.png)

</div>

---

### The Next Frontier
<!-- _class: hero -->

![bg](https://example.com/space.jpg)

# To The Moon
And beyond.

---

## Financials

---

### Budget Breakdown
<!-- _class: cols-3 -->

<div class="col">

#### R&D
40%
Investment in core tech.

</div>

<div class="col">

#### Marketing
30%
Global campaign launch.

</div>

<div class="col">

#### Ops
30%
Server costs & scaling.

</div>
```

## Instructions for execution

1.  **Analyze Request**: Understand the core message and audience.
2.  **Outline**: Create a section-by-section outline.
3.  **Draft Content**: Fill in the slides, applying rules strictly.
4.  **Review Layouts**: Ensure every slide has a layout strategy (standard vs. columns vs. visual).
5.  **Final Polish**: Check for "Wall of Text" and break up slides if necessary.
