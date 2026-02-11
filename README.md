# Markdown to Slide creator

[![CI](https://github.com/sun-flat-yamada/markdown-to-slide-creator/actions/workflows/ci.yml/badge.svg)](https://github.com/sun-flat-yamada/markdown-to-slide-creator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> Marp ベースの Corporate スライド生成 CLI ツール。YAML 設定ファイルでコーポレートデザインをパラメーター化し、Markdown 原稿から PDF / PPTX を一発生成します。

## ✨ Features

- **パラメーター化デザイン** — ヘッダー・フッター・カラーパレット・ロゴ等を `corporate-config.yaml` で一元管理
- **自動セクション検出** — `##` 見出しからセクション区切りスライドを自動挿入
- **複数カラーパレット** — YAML 追加のみで新パレットを利用可能
- **AI ツール連携** — プロンプトファイルで GitHub Copilot や Claude Code、Antigravity などと連携
- **PDF / PPTX 出力** — Marp CLI + Chromium でプロフェッショナルな出力

## 📦 Installation

```bash
npm install

# ビルド
npm run build
```

## 🚀 Usage

```bash
# corporate-config.yaml の色やデザインを設定したカラーパレットを作成します (または、プリセットを使用します)。
# active: の行で使用するプリセット名を指定します。
# プリセットは以下企業の公開されているIR情報スライドを元にサンプル作成しています。
#  - TOYOTA
#  - FUJIFILM

# 現行 slides.md を corporate-config.yaml のパラメーターを指定してスライド作成
node dist/index.js build slides.md --config corporate-config.yaml
```

### CLI Options

```text
slide-creator build <input>

Options:
  -c, --config <path>   設定ファイルパス (default: corporate-config.yaml)
  -o, --output <path>   出力ファイルパス
  -f, --format <type>   出力形式: pdf | pptx (default: pdf)
  --init                設定テンプレートとプロンプトを初期生成
```

## ⚙️ Configuration

`corporate-config.yaml` でスライドデザインを制御します。主な設定項目：

| カテゴリ | 設定例 |
| --- | --- |
| ヘッダー / フッター | テキスト、背景色、3分割レイアウト |
| カラーパレット | primary, secondary, accent, gradients |
| ページ番号 | フォーマット、位置、非表示条件 |
| 特殊スライド | 表紙 (`cover`)、セクション区切り、最終ページ |
| ロゴ | パス、幅、配置位置 |

詳細は [仕様書](./docs/specification.md) および [設計書](./docs/design.md) を参照してください。

## 🛠 Development

```bash
# 依存インストール
npm install

# Lint
npm run lint

# 型チェック
npm run typecheck

# テスト
npm test

# ビルド
npm run build

# 開発モードで実行
npm run dev
```

### Project Structure

```text
src/
├── index.ts            # CLI エントリーポイント
├── config/             # YAML 設定の読み込み・バリデーション (Zod)
├── preprocessor/       # Markdown 前処理 (セクション検出・スライド挿入)
├── theme/              # Marp テーマ CSS 生成 (EJS テンプレート)
└── runner/             # Marp CLI 実行ラッパー
tests/
├── preprocessor.test.ts
├── section-detector.test.ts
└── theme-generator.test.ts
docs/
├── specification.md    # 仕様書
└── design.md           # 設計書
```

## 🤖 AI Configuration

このプロジェクトは AI Agent (Cursor, Windsurf, etc.) 向けの設定を含んでいます。

- **`.agent/AGENTS.md`**: AI Agent 向けのプロジェクト概要とガイドライン
- **`.cursor/rules/`**: コーディング規約 (TypeScript, Marp theme)
- **`.agent/workflows/`**: 定型作業のワークフロー定義
    - `add-design-pattern.md`: 新しい企業デザインを追加するフロー
    - `generate-slides.md`: スライド生成テストのフロー
- **`.agent/skills/`**: AI が利用可能なカスタムスキル
    - `analyze-slide-design`: PDF からデザイン情報を抽出・分析するツールセット

## 📄 License

[MIT](./LICENSE) © 2026 Youhei Yamada
