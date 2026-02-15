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
  const cover = autoCover ? detectCover(body) : null;
  let sections = autoSection ? detectSections(body, headingLevel) : [];

  // 表紙として使用された行をセクションから除外する
  if (cover) {
    const sectionLines = new Set(sections.map((s) => s.headingLine));
    if (cover.subtitleLine !== undefined && sectionLines.has(cover.subtitleLine)) {
      // サブタイトルがセクション見出しとしても検出されている場合は、セクションを優先する
      cover.subtitle = undefined;
      cover.subtitleLine = undefined;
    }
    const coverLines = new Set(
      [cover.titleLine, cover.subtitleLine].filter((l): l is number => l !== undefined),
    );
    sections = sections.filter((s) => !coverLines.has(s.headingLine));
  }

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
    const layout = config.special_slides.cover.layout;
    const coverClass = layout === 'image-right' ? 'cover-image-right' : 'cover';

    const coverLines = [
      `<!-- _class: ${coverClass} -->`,
      `<!-- _paginate: false -->`,
      `<!-- _header: " " -->`,
    ];

    // タイトルなどのテキストコンテンツ用コンテナ開始
    if (layout === 'image-right') {
      coverLines.push('<div class="cover-content">');
      coverLines.push('');
    }

    // 表紙のアクセントライン
    if (config.special_slides.cover.show_accent_line) {
      coverLines.push('<div class="cover-accent"></div>');
      coverLines.push('');
    }

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
      if (line.startsWith('## ') || line.startsWith('# ') || line === '---') break;
      // その他のテキスト（日付など）を表紙に含める
      coverLines.push(bodyLines[i]!);
      afterCoverStart = i + 1;
    }

    if (config.logo && config.special_slides.cover.show_logo) {
      coverLines.push('');
      coverLines.push(
        `<img src="${config.logo.path}" alt="logo" class="cover-logo" style="width: ${config.logo.width};">`,
      );
    }

    // タイトルなどのテキストコンテンツ用コンテナ終了
    if (layout === 'image-right') {
      coverLines.push('');
      coverLines.push('</div>');
    }

    outputSlides.push(coverLines.join('\n'));

    // image-right レイアウトの場合は画像コンテナを最後に追加（または別の位置）
    // CSSでgrid配置されるため、順番は重要
    if (layout === 'image-right' && config.special_slides.cover.image) {
      const lastSlide = outputSlides[outputSlides.length - 1];
      outputSlides[outputSlides.length - 1] =
        lastSlide +
        '\n\n' +
        `<div class="cover-image-container"><img src="${config.special_slides.cover.image}" class="cover-image" /></div>`;
    }
  }

  if (autoSection && sections.length > 0) {
    const bodyLines = body.split('\n');

    for (let si = 0; si < sections.length; si++) {
      const section = sections[si]!;
      const nextSection = sections[si + 1];

      // セクション内コンテンツの範囲を特定
      const contentStart = section.headingLine + 1;
      const contentEnd = nextSection ? nextSection.headingLine : bodyLines.length;

      // 扉ページに含める「冒頭のコンテンツ」を探す
      // 次のスライド区切り (---) または サブセクション (###) が出るまで。
      const leadingContentLines: string[] = [];
      let nextContentStart = contentStart;

      for (let i = contentStart; i < contentEnd; i++) {
        const line = bodyLines[i]!;
        const trimmed = line.trim();
        if (trimmed === '---' || trimmed.startsWith('### ')) {
          break;
        }
        leadingContentLines.push(line);
        nextContentStart = i + 1;
      }

      // セクション区切りスライド
      const sectionNum = String(section.index).padStart(2, '0');
      const dividerLines = [
        `<!-- _class: section-divider -->`,
        `<div class="section-title-area">`,
        `# ${section.title}`,
      ];

      if (leadingContentLines.length > 0) {
        dividerLines.push('');
        dividerLines.push(...leadingContentLines);
      }

      dividerLines.push('</div>');

      if (config.auto_structure.enabled) {
        dividerLines.push(`<span class="section-num">${sectionNum}</span>`);
      }

      outputSlides.push(dividerLines.join('\n'));

      let currentSlideLines: string[] = [];
      let isLayoutSlide = false;

      for (let i = nextContentStart; i < contentEnd; i++) {
        const line = bodyLines[i]!;
        const trimmed = line.trim();

        // --- はスライド区切り（そのまま維持）
        if (trimmed === '---') {
          const hasContent = currentSlideLines.some((l) => l.trim() !== '');
          if (hasContent) {
            outputSlides.push(currentSlideLines.join('\n'));
          }
          currentSlideLines = [];
          isLayoutSlide = false;
          continue;
        }

        // HTMLブロックの前後には空行が必要 (markdown-it の仕様)
        // タグのみの行を見つけたら前後に空行を確保する
        if (trimmed.match(/^<[a-zA-Z0-9]+(\s+[^>]+)?>$/)) {
          currentSlideLines.push(line);
          currentSlideLines.push('');
          continue;
        }

        if (trimmed.match(/^<\/[a-zA-Z0-9]+>$/)) {
          if (
            currentSlideLines.length > 0 &&
            currentSlideLines[currentSlideLines.length - 1].trim() !== ''
          ) {
            currentSlideLines.push('');
          }
          currentSlideLines.push(line);
          continue;
        }

        // レイアウトクラス定義の検出 (<!-- _class: cols-2 --> 等)
        if (trimmed.match(/^<!--\s*_class:\s*(cols-|img-|hero|bg-|image-).*\s*-->/)) {
          isLayoutSlide = true;
        }

        // ### 見出しで新しいスライドを開始
        // ただし、レイアウト指定されたスライド内では ### を分割に使用しない
        if (trimmed.startsWith('### ') && !isLayoutSlide) {
          const hasContent = currentSlideLines.some((l) => l.trim() !== '');
          if (hasContent) {
            outputSlides.push(currentSlideLines.join('\n'));
          }
          currentSlideLines = [];
          isLayoutSlide = false;
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
      endLines.push(
        `<img src="${config.logo.path}" alt="logo" class="end-logo" style="width: ${config.logo.width};">`,
      );
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
