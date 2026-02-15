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
    height: '40px',
    left: '',
    center: '',
    right: '',
    background: 'transparent',
    color: '#333',
  },
  footer: {
    height: '36px',
    left: '',
    center: '',
    right: '',
    background: 'transparent',
    color: '#666',
    company_name: 'TestCorp',
  },
  pagination: {
    enabled: true,
    format: '{{page}}',
    position: 'footer-right',
    hide_on: ['cover', 'end'],
    start_from: 2,
  },
  margin: { top: '60px', bottom: '50px', left: '50px', right: '50px' },
  special_slides: {
    cover: { background: '#FFF', layout: 'default' },
    section_divider: { background: '#FFF', layout: 'default' },
    end: { background: '#FFF', show_logo: false, show_tagline: false, layout: 'default' },
  },
  auto_structure: {
    enabled: true,
    section_heading_level: 2,
    auto_cover: true,
    auto_end: true,
  },
  ai_prompt: { path: './.agent/skills/create-slide-deck/SKILL.md' },
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

  it('should render logo with img tag on cover and end slides', () => {
    const md = `# Title`;
    const logoConfig: CorporateConfig = {
      ...testConfig,
      logo: {
        path: './assets/corp_logo_mdsc.png',
        width: '120px',
        position: 'footer-right',
      },
      special_slides: {
        ...testConfig.special_slides,
        cover: { ...testConfig.special_slides.cover, show_logo: true },
        end: { ...testConfig.special_slides.end, show_logo: true },
      },
    };
    const result = preprocessMarkdown(md, logoConfig);

    expect(result.markdown).toContain(
      '<img src="./assets/corp_logo_mdsc.png" alt="logo" class="cover-logo" style="width: 120px;">',
    );
    expect(result.markdown).toContain(
      '<img src="./assets/corp_logo_mdsc.png" alt="logo" class="end-logo" style="width: 120px;">',
    );
  });

  it('should generate cover with image-right layout', () => {
    const layoutConfig: CorporateConfig = JSON.parse(JSON.stringify(testConfig));
    layoutConfig.special_slides.cover.layout = 'image-right';
    layoutConfig.special_slides.cover.image = './assets/cover_sample_wave.png';

    const md = `# Title\n## Subtitle`;
    const result = preprocessMarkdown(md, layoutConfig);

    expect(result.markdown).toContain('<!-- _class: cover-image-right -->');
    expect(result.markdown).toContain('<div class="cover-content">');
    expect(result.markdown).toContain(
      '<div class="cover-image-container"><img src="./assets/cover_sample_wave.png" class="cover-image" /></div>',
    );
  });

  it('should include leading content in section divider slide', () => {
    const md = `# Title\n## Section 1\nAugust 6, 2025\n\n### Sub-section\nContent`;
    const result = preprocessMarkdown(md, testConfig);

    expect(result.markdown).toContain('<div class="section-title-area">');
    expect(result.markdown).toContain('<h1>Section 1</h1>');
    expect(result.markdown).toContain('August 6, 2025');
    // The content after ### should be on a separate slide
    const slides = result.markdown.split(/\n---\n/);
    // front-matter/cover is slide 0, divider is slide 1... wait
    // Actually split by '---' gives:
    // 0: front-matter
    // 1: cover
    // 2: section-divider
    // 3: sub-section
    expect(slides[2]).toContain('<!-- _class: section-divider -->');
    expect(slides[2]).toContain('August 6, 2025');
    expect(slides[3]).toContain('### Sub-section');
  });

  it('should NOT include Marp directives in leading content of section divider', () => {
    const md = `# Title\n## Section 1\n<!-- _class: cols-2 -->\n\nContent`;
    const result = preprocessMarkdown(md, testConfig);

    // The directive should NOT be in the divider area
    expect(result.markdown).not.toContain(
      '<div class="section-title-area">\n<!-- _class: cols-2 -->',
    );

    const slides = result.markdown.split(/\n---\n/);
    // Divider is index 2, content is index 3
    expect(slides[2]).toContain('<!-- _class: section-divider -->');
    expect(slides[2]).not.toContain('<!-- _class: cols-2 -->');
    expect(slides[3]).toContain('<!-- _class: cols-2 -->');
  });
});
