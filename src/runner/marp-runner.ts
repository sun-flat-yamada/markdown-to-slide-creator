import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface MarpRunnerOptions {
  /** 前処理済み Markdown ファイルパス */
  inputPath: string;
  /** CSS テーマファイルパス */
  themePath: string;
  /** 出力ファイルパス (.pdf / .pptx / .html) */
  outputPath: string;
  /** HTML タグの有効化 (default: true) */
  html?: boolean;
}

/**
 * Marp CLI を実行してスライドを変換する。
 */
export function runMarp(options: MarpRunnerOptions): void {
  const { inputPath, themePath, outputPath, html = true } = options;

  // 出力形式を拡張子から判定
  const ext = path.extname(outputPath).toLowerCase();
  const formatArgs: string[] = [];

  switch (ext) {
    case '.pdf':
      formatArgs.push('--pdf');
      break;
    case '.pptx':
      formatArgs.push('--pptx');
      break;
    case '.html':
      // デフォルト
      break;
    default:
      formatArgs.push('--pdf'); // デフォルトは PDF
  }

  // Marp CLI コマンド構築
  const args = [
    'npx',
    '--yes',
    '@marp-team/marp-cli',
    '--theme',
    themePath,
    ...(html ? ['--html'] : []),
    ...formatArgs,
    inputPath,
    '--allow-local-files',
    '-o',
    outputPath,
  ];

  const command = args.join(' ');
  console.log(`🚀 Marp CLI 実行中: ${command}`);

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: path.dirname(inputPath),
    });
    console.log(`✅ 出力完了: ${outputPath}`);
  } catch (error) {
    throw new Error(`Marp CLI の実行に失敗しました: ${error}`);
  }
}

/**
 * ビルドに必要な一時ファイルを作成し、Marp CLI を実行する。
 */
export function buildSlides(
  processedMarkdown: string,
  themeCssPath: string,
  outputPath: string,
  workDir: string,
): void {
  // 一時 Markdown ファイルを作成
  const tempMdPath = path.join(workDir, '.slide-creator-temp.md');
  fs.writeFileSync(tempMdPath, processedMarkdown, 'utf-8');

  try {
    runMarp({
      inputPath: tempMdPath,
      themePath: themeCssPath,
      outputPath: path.resolve(outputPath),
    });
  } finally {
    // 一時ファイルを削除
    if (fs.existsSync(tempMdPath)) {
      fs.unlinkSync(tempMdPath);
    }
  }
}
