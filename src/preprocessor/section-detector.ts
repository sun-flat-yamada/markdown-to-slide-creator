/**
 * Markdown の ## 見出しを検出してセクション境界を特定する。
 */

export interface Section {
  /** セクション番号 (1始まり) */
  index: number;
  /** セクション名 */
  title: string;
  /** ## 見出しが存在する行番号 (0始まり) */
  headingLine: number;
}

/**
 * Markdown テキストからセクション境界を検出する。
 *
 * @param markdown - Markdown テキスト
 * @param headingLevel - セクション区切りとして認識する見出しレベル (default: 2)
 * @returns 検出されたセクション一覧
 */
export function detectSections(markdown: string, headingLevel: number = 2): Section[] {
  const lines = markdown.split('\n');
  const prefix = '#'.repeat(headingLevel) + ' ';
  const sections: Section[] = [];
  let sectionIndex = 0;

  // front-matter をスキップ
  let frontMatterEnd = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        frontMatterEnd = i;
        break;
      }
    }
  }

  for (let i = frontMatterEnd; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // 既にディレクティブが手動指定されている場合はスキップ
    // (前の行に <!-- _class: --> がある場合)
    if (i > 0 && lines[i - 1]?.trim().match(/<!--\s*_class:\s*\w+\s*-->/)) {
      continue;
    }

    if (trimmed.startsWith(prefix) && !trimmed.startsWith(prefix + '#')) {
      sectionIndex++;
      const title = trimmed.slice(prefix.length).trim();
      sections.push({
        index: sectionIndex,
        title,
        headingLine: i,
      });
    }
  }

  return sections;
}

/**
 * 先頭の # 見出しを表紙情報として抽出する。
 * 存在しない場合は null を返す。
 */
export interface CoverInfo {
  title: string;
  subtitle?: string;
  /** # 見出しの行番号 */
  titleLine: number;
  /** サブタイトル行番号 (存在する場合) */
  subtitleLine?: number;
}

export function detectCover(markdown: string): CoverInfo | null {
  const lines = markdown.split('\n');

  // front-matter をスキップ
  let startLine = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        startLine = i + 1;
        break;
      }
    }
  }

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line === '') continue;

    if (line.startsWith('# ') && !line.startsWith('## ')) {
      const title = line.slice(2).trim();
      const cover: CoverInfo = { title, titleLine: i };

      // 次の行にサブタイトル (## ) があれば取得
      // 空行をあけずに記述された場合のみサブタイトルとみなす
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && nextLine.startsWith('## ') && !nextLine.startsWith('### ')) {
        cover.subtitle = nextLine.slice(3).trim();
        cover.subtitleLine = i + 1;
      }
      return cover;
    }
    // 最初の非空行が # でなければ表紙なし
    break;
  }
  return null;
}
