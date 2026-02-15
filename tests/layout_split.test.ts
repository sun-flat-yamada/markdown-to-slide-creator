import { describe, it, expect } from 'vitest';
import { preprocessMarkdown } from '../src/preprocessor/preprocessor';
import { loadConfig } from '../src/config';
import path from 'path';

describe('Layout Splitting Issue', () => {
  const config = loadConfig(path.resolve('./corporate-config.yaml'));

  it('should NOT split slides on ### when using 2-column layout', () => {
    // We must use a valid section structure to trigger the section-based splitting logic
    const markdown = `
## Test Section

<!-- _class: cols-2 -->

<div class="col">
### Left Column
Content 1
</div>

<div class="col">
### Right Column
Content 2
</div>
`;

    // Ensure autoSection is enabled so detectSections finds "Test Section"
    // and enters the loop where splitting logic resides.
    const result = preprocessMarkdown(markdown, config, {
      autoSection: true,
      autoCover: false,
      autoEnd: false,
    });

    // Debug output if needed
    // console.log(result.markdown);

    const slides = result.markdown.split('\n---\n');

    // Expected slides:
    // 1. Frontmatter (part of the first chunk if split by \n---\n correctly, or separate)
    // 2. Section Divider Slide ("# Test Section")
    // 3. Layout Slide (cols-2) containing BOTH Left and Right columns.

    // If it was split incorrectly, we would have:
    // Divider -> Left Slide -> Right Slide (Total 3 content slides + FM)

    // Let's count occurrences of "###" in the LAST slide.
    // The last slide should contain both "Left Column" and "Right Column".

    const lastSlide = slides[slides.length - 1];

    expect(lastSlide).toContain('cols-2');
    expect(lastSlide).toContain('### Left Column');
    expect(lastSlide).toContain('### Right Column');

    // Also verify it didn't insert '---' between them
    // The 'split' above consumes '---', so if they are in the same string, they are in the same slide.
  });

  it('should split slides on ### for normal slides', () => {
    const markdown = `
## Normal Section

### Slide 1
Content 1

### Slide 2
Content 2
`;
    const result = preprocessMarkdown(markdown, config, {
      autoSection: true,
      autoCover: false,
      autoEnd: false,
    });
    const slides = result.markdown.split('\n---\n');

    // We expect:
    // 1. Divider
    // 2. Slide 1
    // 3. Slide 2
    // Plus frontmatter.
    // Just check that Slide 1 and Slide 2 are in DIFFERENT chunks.

    const slide1Match = slides.find((s) => s.includes('### Slide 1'));
    const slide2Match = slides.find((s) => s.includes('### Slide 2'));

    expect(slide1Match).toBeDefined();
    expect(slide2Match).toBeDefined();
    expect(slide1Match).not.toBe(slide2Match);
  });
});
