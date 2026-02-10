import type { CorporateConfig } from '../config/index.js';
import { getActivePalette } from '../config/index.js';

/**
 * ヘッダー/フッター用の HTML を生成する。
 * 3分割レイアウトを span タグで構造化する。
 */
function buildHeaderFooterHtml(
  left: string,
  center: string,
  right: string,
  prefix: 'h' | 'f'
): string {
  return `<span class="${prefix}l">${left}</span><span class="${prefix}c">${center}</span><span class="${prefix}r">${right}</span>`;
}

/**
 * テンプレート変数を展開する。
 */
function expandVars(template: string, config: CorporateConfig): string {
  let result = template;

  // {{company_name}}
  result = result.replace(/\{\{company_name\}\}/g, config.footer.company_name ?? '');

  // {{logo}}
  if (config.logo) {
    const logoHtml = `<img src="${config.logo.path}" width="${config.logo.width}">`;
    result = result.replace(/\{\{logo\}\}/g, logoHtml);
  }

  // {{nav_tabs}} — セクションナビゲーション (プレースホルダ: 実際にはセクション情報が必要)
  result = result.replace(/\{\{nav_tabs\}\}/g, '');

  // {{page}} / {{total}} は Marp の paginate に委譲するので空にする
  // (フッター内テキストとしてはそのまま残す — Marp が自動でページ番号を section::after に挿入)
  // ただし company_name + ページ番号は footer HTML として渡す
  result = result.replace(/\{\{page\}\}/g, '');
  result = result.replace(/\{\{total\}\}/g, '');

  // {{gradient:xxx}}
  const palette = getActivePalette(config);
  result = result.replace(/\{\{gradient:(\w+)\}\}/g, (_m, name) => {
    const g = palette.gradients.find((gr) => gr.name === name);
    return g ? `linear-gradient(${g.direction}, ${g.stops.join(', ')})` : '';
  });

  // {{primary}} etc.
  const colorMap: Record<string, string> = {
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
  };
  result = result.replace(/\{\{(\w+)\}\}/g, (_m, key) => colorMap[key] ?? '');

  return result;
}

/**
 * front-matter のヘッダー/フッターディレクティブ文字列を生成する。
 */
export function buildHeaderDirective(config: CorporateConfig): string {
  const left = expandVars(config.header.left, config);
  const center = expandVars(config.header.center, config);
  const right = expandVars(config.header.right, config);
  return buildHeaderFooterHtml(left, center, right, 'h');
}

export function buildFooterDirective(config: CorporateConfig): string {
  const left = expandVars(config.footer.left, config);
  const center = expandVars(config.footer.center, config);
  const right = expandVars(config.footer.right, config);
  return buildHeaderFooterHtml(left, center, right, 'f');
}
