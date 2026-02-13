import type { CorporateConfig } from './schema.js';

/**
 * デフォルト設定値。
 * ユーザー設定とマージされ、未指定項目にこの値が使われる。
 */
export const DEFAULT_CONFIG: Partial<CorporateConfig> = {
  slide: {
    size: '16:9',
  },
  header: {
    height: '40px',
    left: '',
    center: '',
    right: '',
    background: 'transparent',
    color: '#333333',
  },
  footer: {
    height: '36px',
    left: '',
    center: '',
    right: '{{company_name}}　{{page}}',
    background: 'transparent',
    color: '#666666',
    company_name: '',
  },
  pagination: {
    enabled: true,
    format: '{{page}}',
    position: 'footer-right',
    hide_on: ['cover', 'end'],
    start_from: 2,
  },
  margin: {
    top: '60px',
    bottom: '50px',
    left: '50px',
    right: '50px',
  },
  special_slides: {
    cover: {
      background: '#FFFFFF',
      title_color: '#333333',
      title_align: 'left',
      show_accent_line: true,
      show_logo: true,
      logo_position: 'bottom-right',
      layout: 'default',
    },
    section_divider: {
      background: '#FFFFFF',
      show_section_number: true,
      number_color: '#E0E0E0',
      show_nav_tabs: true,
      separator_line: true,
      layout: 'default',
    },
    end: {
      background: '#FFFFFF',
      show_logo: true,
      logo_position: 'center',
      show_tagline: true,
      tagline: '',
      layout: 'default',
    },
  },
  auto_structure: {
    enabled: true,
    section_heading_level: 2,
    auto_cover: true,
    auto_end: true,
  },
  ai_prompt: {
    path: './prompts/slide-convert.md',
  },
};
