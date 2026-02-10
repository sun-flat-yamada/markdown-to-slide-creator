import { describe, it, expect } from 'vitest';
import { generateThemeCss } from '../src/theme/generator.js';
import type { CorporateConfig } from '../src/config/schema.js';

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
        gradients: [
          { name: 'header', direction: 'to right', stops: ['#00A78E', '#005A57'] },
          { name: 'cover-line', direction: 'to right', stops: ['#00A78E', '#00C9A7'] },
        ],
      },
    },
  },
  header: {
    height: '40px', left: '', center: '', right: '',
    background: 'transparent', color: '#333333',
  },
  footer: {
    height: '36px', left: '', center: '', right: '',
    background: 'transparent', color: '#666666', company_name: 'TestCorp',
  },
  pagination: {
    enabled: true, format: '{{page}}', position: 'footer-right',
    hide_on: ['cover', 'end'], start_from: 2,
  },
  margin: { top: '60px', bottom: '50px', left: '50px', right: '50px' },
  special_slides: {
    cover: {
      background: '#FFFFFF',
      title_color: '#333333',
      show_accent_line: true,
      accent_line_color: '{{gradient:cover-line}}',
      show_logo: true,
      logo_position: 'bottom-right',
    },
    section_divider: {
      background: '#FFFFFF',
      title_color: '{{primary}}',
      show_section_number: true,
      number_color: '#E0E0E0',
      separator_line: true,
    },
    end: {
      background: '#FFFFFF',
      show_logo: true,
      show_tagline: true,
      tagline: 'Value from Innovation',
    },
  },
  auto_structure: {
    enabled: true, section_heading_level: 2,
    auto_cover: true, auto_end: true,
  },
  ai_prompt: { path: './prompts/slide-convert.md' },
};

describe('generateThemeCss', () => {
  it('should generate CSS with @theme meta', () => {
    const css = generateThemeCss(testConfig);
    expect(css).toContain('@theme corporate');
  });

  it('should include CSS custom properties', () => {
    const css = generateThemeCss(testConfig);
    expect(css).toContain('--color-primary: #00A78E');
    expect(css).toContain('--color-accent: #E87722');
    expect(css).toContain('--header-height: 40px');
  });

  it('should include gradient definitions', () => {
    const css = generateThemeCss(testConfig);
    expect(css).toContain('--gradient-header');
    expect(css).toContain('linear-gradient(to right, #00A78E, #005A57)');
  });

  it('should include cover slide styles', () => {
    const css = generateThemeCss(testConfig);
    expect(css).toContain('section.cover');
  });

  it('should include section-divider styles', () => {
    const css = generateThemeCss(testConfig);
    expect(css).toContain('section.section-divider');
  });

  it('should include end slide styles', () => {
    const css = generateThemeCss(testConfig);
    expect(css).toContain('section.end');
  });

  it('should include header/footer layout', () => {
    const css = generateThemeCss(testConfig);
    expect(css).toContain('header');
    expect(css).toContain('footer');
  });
});
