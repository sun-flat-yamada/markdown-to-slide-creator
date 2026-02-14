#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config/index.js';
import { writeThemeCss } from './theme/generator.js';
import { preprocessMarkdown } from './preprocessor/index.js';
import { buildSlides } from './runner/marp-runner.js';

const program = new Command();

program
  .name('slide-creator')
  .description('Marp-based corporate slide generator with parameterized design')
  .version('0.1.0');

// ===== build コマンド =====
program
  .command('build')
  .description('Markdown からスライドを生成')
  .argument('<input>', 'Markdown ファイルパス')
  .option('-c, --config <path>', '設定ファイルパス', './corporate-config.yaml')
  .option('-o, --output <path>', '出力ファイルパス', '')
  .option('--palette <name>', 'カラーパレットを一時的に切り替え')
  .option('--no-auto-cover', '表紙の自動挿入を無効化')
  .option('--no-auto-end', '最終ページの自動挿入を無効化')
  .option('--no-auto-section', 'セクション自動検出を無効化')
  .action(
    async (
      input: string,
      opts: {
        config: string;
        output: string;
        palette?: string;
        autoCover: boolean;
        autoEnd: boolean;
        autoSection: boolean;
      },
    ) => {
      try {
        // 入力ファイル読み込み
        const inputPath = path.resolve(input);
        if (!fs.existsSync(inputPath)) {
          console.error(`❌ 入力ファイルが見つかりません: ${inputPath}`);
          process.exit(1);
        }
        const markdown = fs.readFileSync(inputPath, 'utf-8');

        // 設定読み込み
        const configPath = path.resolve(opts.config);
        console.log(`📋 設定ファイル: ${configPath}`);
        const config = loadConfig(configPath);

        // パレット一時切り替え
        if (opts.palette) {
          config.colors.active = opts.palette;
        }

        // ロゴパスを絶対パスに解決
        if (config.logo && config.logo.path) {
          const configDir = path.dirname(configPath);
          config.logo.path = path.resolve(configDir, config.logo.path);
          // Windowsの場合、バックスラッシュをスラッシュに置換（Marp/HTML互換性のため）
          config.logo.path = config.logo.path.split(path.sep).join('/');
        }

        // 表紙画像パスを絶対パスに解決
        if (config.special_slides.cover.image) {
          const configDir = path.dirname(configPath);
          config.special_slides.cover.image = path.resolve(
            configDir,
            config.special_slides.cover.image,
          );
          config.special_slides.cover.image = config.special_slides.cover.image
            .split(path.sep)
            .join('/');
        }

        // 出力先
        const outputPath = opts.output || inputPath.replace(/\.md$/, '.pdf');

        console.log(`📝 入力: ${inputPath}`);
        console.log(`📁 出力: ${outputPath}`);

        // CSS テーマ生成
        const workDir = path.dirname(inputPath);
        const themeCssPath = writeThemeCss(config, workDir);
        console.log(`🎨 テーマ CSS 生成: ${themeCssPath}`);

        // Markdown 前処理
        const result = preprocessMarkdown(markdown, config, {
          autoSection: opts.autoSection,
          autoCover: opts.autoCover,
          autoEnd: opts.autoEnd,
        });

        console.log(`📑 検出セクション: ${result.sections.length}`);
        if (result.cover) {
          console.log(`📄 表紙: "${result.cover.title}"`);
        }

        // Marp CLI 実行
        buildSlides(result.markdown, themeCssPath, outputPath, workDir);

        // テーマ CSS クリーンアップ
        if (fs.existsSync(themeCssPath)) {
          fs.unlinkSync(themeCssPath);
        }
      } catch (error) {
        console.error(`❌ エラー: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    },
  );

// ===== init コマンド =====
program
  .command('init')
  .description('設定ファイルとプロンプトのテンプレートを初期化')
  .action(() => {
    const configTemplate = path.resolve('./corporate-config.yaml');
    const promptDir = path.resolve('./prompts');

    if (fs.existsSync(configTemplate)) {
      console.log('⚠️  corporate-config.yaml は既に存在します');
    } else {
      // デフォルト設定ファイルをコピー
      const defaultConfig = path.join(
        path.dirname(new URL(import.meta.url).pathname),
        '..',
        'corporate-config.yaml',
      );
      if (fs.existsSync(defaultConfig)) {
        fs.copyFileSync(defaultConfig, configTemplate);
      } else {
        console.log('📋 デフォルト設定ファイルのテンプレートを作成...');
        fs.writeFileSync(
          configTemplate,
          '# slide-creator corporate config\n# See docs/specification.md for details\n',
          'utf-8',
        );
      }
      console.log(`✅ 設定ファイル作成: ${configTemplate}`);
    }

    if (!fs.existsSync(promptDir)) {
      fs.mkdirSync(promptDir, { recursive: true });
      console.log(`✅ プロンプトディレクトリ作成: ${promptDir}`);
    }

    console.log('🎉 初期化完了!');
  });

program.parse();
