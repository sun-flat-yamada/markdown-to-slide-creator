import { describe, it, expect } from 'vitest';
import { preprocessMarkdown } from '../src/preprocessor/preprocessor.js';
import type { CorporateConfig } from '../src/config/schema.js';

// テスト用の最小設定
const testConfig: CorporateConfig = {
  slide: { size: '16:9' },
  colors: {
    active: 'test',
    palettes: {
      test: {
        primary: '#00A78E',
        secondary: '#005A57',
        accent: '#E87722',
        negative: '#C00000',
        background: '#FFFFFF',
        text: '#333333',
        muted: '#999999',
        gradients: [],
      },
    },
  },
  header: {
    height: '40px', left: '', center: '', right: '',
    background: 'transparent', color: '#333',
  },
  footer: {
    height: '36px', left: '', center: '', right: '',
    background: 'transparent', color: '#666', company_name: 'TestCorp',
  },
  pagination: {
    enabled: true, format: '{{page}}', position: 'footer-right',
    hide_on: ['cover', 'end'], start_from: 2,
  },
  margin: { top: '60px', bottom: '50px', left: '50px', right: '50px' },
  special_slides: {
    cover: { background: '#FFF' },
    section_divider: { background: '#FFF' },
    end: { background: '#FFF', show_logo: false, show_tagline: false },
  },
  auto_structure: {
    enabled: true, section_heading_level: 2,
    auto_cover: true, auto_end: true,
  },
  ai_prompt: { path: './prompts/slide-convert.md' },
};

describe('preprocessMarkdown', () => {
  it('should generate front-matter with marp directives', () => {
    const md = `# Title\n## Section 1\nContent`;
    const result = preprocessMarkdown(md, testConfig);

    expect(result.markdown).toContain('marp: true');
    expect(result.markdown).toContain('theme: corporate');
    expect(result.markdown).toContain('paginate: true');
  });

  it('should insert cover slide with auto_cover', () => {
    const md = `# My Title\n## Subtitle\n\n## Section 1\nContent`;
    const result = preprocessMarkdown(md, testConfig);

    expect(result.markdown).toContain('<!-- _class: cover -->');
    expect(result.markdown).toContain('# My Title');
    expect(result.cover).not.toBeNull();
    expect(result.cover?.title).toBe('My Title');
  });

  it('should insert section divider slides', () => {
    const md = `# Title\n## Section 1\nContent 1\n## Section 2\nContent 2`;
    const result = preprocessMarkdown(md, testConfig);

    expect(result.markdown).toContain('<!-- _class: section-divider -->');
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0]?.title).toBe('Section 1');
    expect(result.sections[1]?.title).toBe('Section 2');
  });

  it('should insert end slide with auto_end', () => {
    const md = `# Title\n## Section 1\nContent`;
    const result = preprocessMarkdown(md, testConfig);

    expect(result.markdown).toContain('<!-- _class: end -->');
  });

  it('should skip cover when autoCover is false', () => {
    const md = `# Title\n## Section 1\nContent`;
    const result = preprocessMarkdown(md, testConfig, { autoCover: false });

    expect(result.markdown).not.toContain('<!-- _class: cover -->');
  });

  it('should skip end when autoEnd is false', () => {
    const md = `# Title\n## Section 1\nContent`;
    const result = preprocessMarkdown(md, testConfig, { autoEnd: false });

    expect(result.markdown).not.toContain('<!-- _class: end -->');
  });
});
