import { z } from 'zod';

// ===== Gradient =====
export const GradientSchema = z.object({
  name: z.string(),
  direction: z.string(),
  stops: z.array(z.string()),
});
export type Gradient = z.infer<typeof GradientSchema>;

// ===== Color Palette =====
export const ColorPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  negative: z.string().default('#C00000'),
  background: z.string().default('#FFFFFF'),
  text: z.string().default('#333333'),
  muted: z.string().default('#999999'),
  gradients: z.array(GradientSchema).default([]),
});
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;

// ===== Header / Footer =====
export const HeaderFooterSchema = z.object({
  height: z.string().default('40px'),
  left: z.string().default(''),
  center: z.string().default(''),
  right: z.string().default(''),
  background: z.string().default('transparent'),
  color: z.string().default('#333333'),
});

export const FooterSchema = z.object({
  height: z.string().default('36px'),
  left: z.string().default(''),
  center: z.string().default(''),
  right: z.string().default(''),
  background: z.string().default('transparent'),
  color: z.string().default('#666666'),
  company_name: z.string().default(''),
});

// ===== Pagination =====
export const PaginationSchema = z.object({
  enabled: z.boolean().default(true),
  format: z.string().default('{{page}}'),
  position: z.string().default('footer-right'),
  hide_on: z.array(z.string()).default(['cover', 'end']),
  start_from: z.number().default(2),
});

// ===== Margin =====
export const MarginSchema = z.object({
  top: z.string().default('60px'),
  bottom: z.string().default('50px'),
  left: z.string().default('50px'),
  right: z.string().default('50px'),
});

// ===== Logo =====
export const LogoSchema = z.object({
  path: z.string(),
  width: z.string().default('150px'),
  position: z.string().default('footer-right'),
});

// ===== Slide Size =====
export const SlideSizeSchema = z.union([
  z.string(),
  z.object({ width: z.string(), height: z.string() }),
]);

// ===== Special Slide Config =====
export const SpecialSlideSchema = z.object({
  background: z.string().default('#FFFFFF'),
  title_color: z.string().optional(),
  title_align: z.string().optional(),
  show_accent_line: z.boolean().optional(),
  accent_line_color: z.string().optional(),
  show_logo: z.boolean().optional(),
  logo_position: z.string().optional(),
  show_section_number: z.boolean().optional(),
  number_color: z.string().optional(),
  show_nav_tabs: z.boolean().optional(),
  separator_line: z.boolean().optional(),
  show_tagline: z.boolean().optional(),
  tagline: z.string().optional(),
});
export type SpecialSlideConfig = z.infer<typeof SpecialSlideSchema>;

// ===== Auto Structure =====
export const AutoStructureSchema = z.object({
  enabled: z.boolean().default(true),
  section_heading_level: z.number().default(2),
  auto_cover: z.boolean().default(true),
  auto_end: z.boolean().default(true),
});

// ===== AI Prompt =====
export const AiPromptSchema = z.object({
  path: z.string().default('./prompts/slide-convert.md'),
});

// ===== Root Config =====
export const CorporateConfigSchema = z.object({
  slide: z.object({
    size: SlideSizeSchema.default('16:9'),
  }).default({ size: '16:9' }),
  colors: z.object({
    active: z.string(),
    palettes: z.record(z.string(), ColorPaletteSchema),
  }),
  logo: LogoSchema.optional(),
  header: HeaderFooterSchema.default({
    height: '40px', left: '', center: '', right: '',
    background: 'transparent', color: '#333333',
  }),
  footer: FooterSchema.default({
    height: '36px', left: '', center: '', right: '',
    background: 'transparent', color: '#666666', company_name: '',
  }),
  pagination: PaginationSchema.default({
    enabled: true, format: '{{page}}', position: 'footer-right',
    hide_on: ['cover', 'end'], start_from: 2,
  }),
  margin: MarginSchema.default({
    top: '60px', bottom: '50px', left: '50px', right: '50px',
  }),
  special_slides: z.object({
    cover: SpecialSlideSchema.default({ background: '#FFFFFF' }),
    section_divider: SpecialSlideSchema.default({ background: '#FFFFFF' }),
    end: SpecialSlideSchema.default({ background: '#FFFFFF' }),
  }).default({
    cover: { background: '#FFFFFF' },
    section_divider: { background: '#FFFFFF' },
    end: { background: '#FFFFFF' },
  }),
  auto_structure: AutoStructureSchema.default({
    enabled: true, section_heading_level: 2, auto_cover: true, auto_end: true,
  }),
  ai_prompt: AiPromptSchema.default({
    path: './prompts/slide-convert.md',
  }),
});

export type CorporateConfig = z.infer<typeof CorporateConfigSchema>;
