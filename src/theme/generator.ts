import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import { type CorporateConfig, getActivePalette } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, 'templates');

/**
 * テンプレートファイルのリスト（結合順序）
 */
const TEMPLATE_FILES = [
  'base.css.ejs',
  'header-footer.css.ejs',
  'cover.css.ejs',
  'section-divider.css.ejs',
  'end.css.ejs',
];

/**
 * グラデーション参照を展開する。
 * "{{gradient:header}}" → "linear-gradient(to right, #00A78E, #005A57)"
 */
function resolveGradientRefs(value: string, config: CorporateConfig): string {
  const palette = getActivePalette(config);
  return value.replace(/\{\{gradient:(\w+)\}\}/g, (_match, name) => {
    const gradient = palette.gradients.find((g) => g.name === name);
    if (gradient) {
      return `linear-gradient(${gradient.direction}, ${gradient.stops.join(', ')})`;
    }
    return '';
  });
}

/**
 * 色参照を展開する。
 * "{{primary}}" → "#00A78E"
 */
function resolveColorRefs(value: string, config: CorporateConfig): string {
  const palette = getActivePalette(config);
  const colorMap: Record<string, string> = {
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    negative: palette.negative,
    background: palette.background,
    text: palette.text,
    muted: palette.muted,
  };
  return value.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    return colorMap[key] ?? `{{${key}}}`;
  });
}

/**
 * 設定値内のテンプレート変数をすべて展開する。
 */
function resolveConfigVars(value: string | undefined, config: CorporateConfig): string {
  if (!value) return '';
  let resolved = resolveGradientRefs(value, config);
  resolved = resolveColorRefs(resolved, config);
  return resolved;
}

/**
 * CorporateConfig から Marp 用 CSS テーマ文字列を生成する。
 */
export function generateThemeCss(config: CorporateConfig): string {
  const palette = getActivePalette(config);

  // テンプレートに渡すデータ
  const data = {
    palette,
    header: config.header,
    footer: config.footer,
    margin: config.margin,
    slideSize: config.slide.size,
    cover: {
      ...config.special_slides.cover,
      title_color: resolveConfigVars(config.special_slides.cover.title_color, config),
      accent_line_color: resolveConfigVars(config.special_slides.cover.accent_line_color, config),
    },
    sectionDivider: {
      ...config.special_slides.section_divider,
      title_color: resolveConfigVars(config.special_slides.section_divider.title_color, config),
      number_color: resolveConfigVars(config.special_slides.section_divider.number_color, config),
    },
    end: {
      ...config.special_slides.end,
    },
  };

  // 各テンプレートをレンダリングして結合
  const cssSegments: string[] = [];

  for (const templateFile of TEMPLATE_FILES) {
    const templatePath = path.join(TEMPLATE_DIR, templateFile);
    if (!fs.existsSync(templatePath)) {
      console.warn(`テンプレートが見つかりません: ${templateFile}`);
      continue;
    }
    const template = fs.readFileSync(templatePath, 'utf-8');
    const rendered = ejs.render(template, data, { filename: templatePath });
    cssSegments.push(rendered);
  }

  return cssSegments.join('\n\n');
}

/**
 * 生成した CSS を一時ファイルに書き出し、パスを返す。
 */
export function writeThemeCss(config: CorporateConfig, outputDir: string): string {
  const css = generateThemeCss(config);
  const outputPath = path.join(outputDir, 'corporate-theme.css');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, css, 'utf-8');
  return outputPath;
}
