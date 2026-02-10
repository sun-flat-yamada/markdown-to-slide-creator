import type { CorporateConfig } from '../config/index.js';
import { detectSections, detectCover, type Section, type CoverInfo } from './section-detector.js';
import { buildHeaderDirective, buildFooterDirective } from './directive-injector.js';

export interface PreprocessResult {
  /** 前処理済み Markdown テキスト */
  markdown: string;
  /** 検出されたセクション一覧 */
  sections: Section[];
  /** 表紙情報 */
  cover: CoverInfo | null;
}

/**
 * Markdown を前処理し、Marp 用のディレクティブを注入する。
 */
export function preprocessMarkdown(
  markdown: string,
  config: CorporateConfig,
  options: {
    autoSection?: boolean;
    autoCover?: boolean;
    autoEnd?: boolean;
  } = {},
): PreprocessResult {
  const autoSection = options.autoSection ?? config.auto_structure.enabled;
  const autoCover = options.autoCover ?? config.auto_structure.auto_cover;
  const autoEnd = options.autoEnd ?? config.auto_structure.auto_end;
  const headingLevel = config.auto_structure.section_heading_level;

  // 既存の front-matter を除去
  let body = markdown;
  if (body.trimStart().startsWith('---')) {
    const match = body.match(/^---\n([\s\S]*?)\n---\n?/);
    if (match) {
      body = body.slice(match[0].length);
    }
  }

  // セクション検出
  const sections = autoSection ? detectSections(body, headingLevel) : [];
  const cover = autoCover ? detectCover(body) : null;

  // ヘッダー/フッター HTML 生成
  const headerHtml = buildHeaderDirective(config);
  const footerHtml = buildFooterDirective(config);

  // スライドサイズ
  const sizeDirective =
    typeof config.slide.size === 'string'
      ? config.slide.size
      : `${config.slide.size.width} ${config.slide.size.height}`;

  // front-matter 構築
  const frontMatter = [
    '---',
    'marp: true',
    'theme: corporate',
    `size: ${sizeDirective}`,
    config.pagination.enabled ? 'paginate: true' : 'paginate: false',
    `header: '${headerHtml.replace(/'/g, "\\'")}'`,
    `footer: '${footerHtml.replace(/'/g, "\\'")}'`,
    '---',
    '',
  ].join('\n');

  // Markdown をスライド単位に再構成
  const outputSlides: string[] = [];

  if (autoCover && cover) {
    // 表紙スライド
    const coverLines = [`<!-- _class: cover -->`, `<!-- _paginate: false -->`];
    coverLines.push(`# ${cover.title}`);
    if (cover.subtitle) {
      coverLines.push(`## ${cover.subtitle}`);
    }
    // 表紙の後の追加テキスト行を収集（## 以外）
    const bodyLines = body.split('\n');
    let afterCoverStart = (cover.subtitleLine ?? cover.titleLine) + 1;
    for (let i = afterCoverStart; i < bodyLines.length; i++) {
      const line = bodyLines[i]!.trim();
      if (line === '') continue;
      if (line.startsWith('## ') || line.startsWith('# ')) break;
      // その他のテキスト（日付など）を表紙に含める
      coverLines.push(bodyLines[i]!);
      afterCoverStart = i + 1;
    }

    if (config.logo && config.special_slides.cover.show_logo) {
      coverLines.push('');
      coverLines.push(`![logo](${config.logo.path})`);
    }

    outputSlides.push(coverLines.join('\n'));
  }

  if (autoSection && sections.length > 0) {
    const bodyLines = body.split('\n');

    for (let si = 0; si < sections.length; si++) {
      const section = sections[si]!;
      const nextSection = sections[si + 1];

      // セクション区切りスライド
      const sectionNum = String(section.index).padStart(2, '0');
      const dividerLines = [
        `<!-- _class: section-divider -->`,
        `<!-- _paginate: false -->`,
        `# ${section.title}`,
        '',
        `<span class="section-num">${sectionNum}</span>`,
      ];
      outputSlides.push(dividerLines.join('\n'));

      // セクション内コンテンツ（次のセクションまで）
      const contentStart = section.headingLine + 1;
      const contentEnd = nextSection ? nextSection.headingLine : bodyLines.length;

      let currentSlideLines: string[] = [];

      for (let i = contentStart; i < contentEnd; i++) {
        const line = bodyLines[i]!;
        const trimmed = line.trim();

        // --- はスライド区切り（そのまま維持）
        if (trimmed === '---') {
          if (currentSlideLines.length > 0) {
            outputSlides.push(currentSlideLines.join('\n'));
            currentSlideLines = [];
          }
          continue;
        }

        // ### 見出しで新しいスライドを開始
        if (trimmed.startsWith('### ')) {
          if (currentSlideLines.length > 0) {
            outputSlides.push(currentSlideLines.join('\n'));
            currentSlideLines = [];
          }
        }

        currentSlideLines.push(line);
      }

      if (currentSlideLines.length > 0) {
        // 空行のみのスライドはスキップ
        const hasContent = currentSlideLines.some((l) => l.trim() !== '');
        if (hasContent) {
          outputSlides.push(currentSlideLines.join('\n'));
        }
      }
    }
  } else if (!autoCover) {
    // 自動構造化なし: そのまま
    outputSlides.push(body);
  } else {
    // 表紙はあるがセクション自動検出なし
    const bodyLines = body.split('\n');
    const startLine = cover ? (cover.subtitleLine ?? cover.titleLine) + 1 : 0;
    const remaining = bodyLines.slice(startLine).join('\n').trim();
    if (remaining) {
      outputSlides.push(remaining);
    }
  }

  // 最終ページ
  if (autoEnd) {
    const endLines = [`<!-- _class: end -->`, `<!-- _paginate: false -->`];
    if (config.logo && config.special_slides.end.show_logo) {
      endLines.push(`![logo](${config.logo.path})`);
    }
    if (config.special_slides.end.show_tagline && config.special_slides.end.tagline) {
      endLines.push('');
      endLines.push(config.special_slides.end.tagline);
    }
    outputSlides.push(endLines.join('\n'));
  }

  // スライドを --- で結合
  const finalMarkdown = frontMatter + outputSlides.join('\n\n---\n\n');

  return {
    markdown: finalMarkdown,
    sections,
    cover,
  };
}
