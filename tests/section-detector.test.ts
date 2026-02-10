import { describe, it, expect } from 'vitest';
import { detectSections, detectCover } from '../src/preprocessor/section-detector.js';

describe('detectSections', () => {
  it('should detect ## headings as section boundaries', () => {
    const md = `# Title
## Section 1
Content 1
## Section 2
Content 2
## Section 3
Content 3`;

    const sections = detectSections(md);
    expect(sections).toHaveLength(3);
    expect(sections[0]?.title).toBe('Section 1');
    expect(sections[0]?.index).toBe(1);
    expect(sections[1]?.title).toBe('Section 2');
    expect(sections[1]?.index).toBe(2);
    expect(sections[2]?.title).toBe('Section 3');
    expect(sections[2]?.index).toBe(3);
  });

  it('should skip front-matter', () => {
    const md = `---
marp: true
---
## Section 1
Content`;

    const sections = detectSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.title).toBe('Section 1');
  });

  it('should not detect ### as section boundary', () => {
    const md = `## Section 1
### Sub heading
Content`;

    const sections = detectSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.title).toBe('Section 1');
  });

  it('should return empty for no ## headings', () => {
    const md = `# Title only
Some content
### Sub heading`;

    const sections = detectSections(md);
    expect(sections).toHaveLength(0);
  });
});

describe('detectCover', () => {
  it('should detect # heading as cover title', () => {
    const md = `# My Presentation
## Subtitle
Some text`;

    const cover = detectCover(md);
    expect(cover).not.toBeNull();
    expect(cover?.title).toBe('My Presentation');
    expect(cover?.subtitle).toBe('Subtitle');
  });

  it('should detect cover without subtitle', () => {
    const md = `# My Presentation
Some text`;

    const cover = detectCover(md);
    expect(cover).not.toBeNull();
    expect(cover?.title).toBe('My Presentation');
    expect(cover?.subtitle).toBeUndefined();
  });

  it('should skip front-matter', () => {
    const md = `---
marp: true
---
# My Title`;

    const cover = detectCover(md);
    expect(cover).not.toBeNull();
    expect(cover?.title).toBe('My Title');
  });

  it('should return null if no # heading', () => {
    const md = `## Section heading
Content`;

    const cover = detectCover(md);
    expect(cover).toBeNull();
  });
});
