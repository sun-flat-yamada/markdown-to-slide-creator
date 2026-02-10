# slide-creator 設計書

> **文書ID**: DESIGN-001  
> **バージョン**: 1.0  
> **作成日**: 2026-02-10  
> **ステータス**: 承認済み  
> **関連仕様書**: SPEC-001

---

## 1. システム構成

### 1.1 全体アーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│                     slide-creator CLI                         │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │Config Loader │  │  Prompt      │  │ Markdown            │ │
│  │  (YAML+Zod)  │  │  Manager     │  │ Preprocessor        │ │
│  └──────┬───────┘  └──────────────┘  │ ├ SectionDetector   │ │
│         │                            │ ├ DirectiveInjector  │ │
│         ▼                            │ └ TemplateVars       │ │
│  ┌──────────────┐                    └──────────┬──────────┘ │
│  │CSS Theme     │                               │            │
│  │Generator     │                               │            │
│  │  (EJS)       │                               │            │
│  └──────┬───────┘                               │            │
│         │    ┌──────────────────────────┘        │            │
│         ▼    ▼                                                │
│  ┌─────────────────┐                                         │
│  │ Marp CLI Wrapper │──→ PDF / PPTX                          │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 処理フロー

```
1. CLI がコマンド引数を解析
2. Config Loader が corporate-config.yaml を読み込み・バリデーション
3. CSS Theme Generator が設定値から EJS テンプレートを使って CSS を動的生成
4. Markdown Preprocessor が入力 Markdown を解析:
   4a. SectionDetector が ## 見出しを検出しセクション境界を特定
   4b. DirectiveInjector が front-matter / ディレクティブを注入
   4c. TemplateVars がテンプレート変数を展開
5. Marp CLI Wrapper が生成 CSS + 前処理済み Markdown を渡して変換実行
6. PDF / PPTX を出力
```

---

## 2. コンポーネント設計

### 2.1 Config Loader (`src/config/`)

#### schema.ts — Zod スキーマ定義

```typescript
// 主要な型定義

interface Gradient {
  name: string;
  direction: string;
  stops: string[];
}

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  negative: string;
  background: string;
  text: string;
  muted: string;
  gradients: Gradient[];
}

interface HeaderFooterConfig {
  height: string;
  left: string;
  center: string;
  right: string;
  background: string;
  color: string;
}

interface PaginationConfig {
  enabled: boolean;
  format: string;
  position: string;
  hide_on: string[];
  start_from: number;
}

interface SpecialSlideConfig {
  background: string;
  title_color?: string;
  title_align?: string;
  show_accent_line?: boolean;
  accent_line_color?: string;
  show_logo?: boolean;
  logo_position?: string;
  show_section_number?: boolean;
  number_color?: string;
  show_nav_tabs?: boolean;
  separator_line?: boolean;
  show_tagline?: boolean;
  tagline?: string;
}

interface AutoStructureConfig {
  enabled: boolean;
  section_heading_level: number;
  auto_cover: boolean;
  auto_end: boolean;
}

interface CorporateConfig {
  slide: { size: string | { width: string; height: string } };
  colors: { active: string; palettes: Record<string, ColorPalette> };
  logo: { path: string; width: string; position: string };
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig & { company_name: string };
  pagination: PaginationConfig;
  margin: { top: string; bottom: string; left: string; right: string };
  special_slides: {
    cover: SpecialSlideConfig;
    section_divider: SpecialSlideConfig;
    end: SpecialSlideConfig;
  };
  auto_structure: AutoStructureConfig;
  ai_prompt: { path: string };
}
```

#### loader.ts — 処理概要

```
1. fs.readFileSync で YAML ファイルを読み込み
2. js-yaml で JavaScript オブジェクトに変換
3. Zod スキーマで型検証
4. defaults.ts のデフォルト値とマージ
5. CorporateConfig オブジェクトを返却
```

### 2.2 CSS Theme Generator (`src/theme/`)

#### generator.ts — 処理概要

```
入力: CorporateConfig
出力: string (CSS テキスト)

1. アクティブパレットを取得
2. CSS カスタムプロパティ (--color-primary 等) を生成
3. EJS テンプレートを順番にレンダリング:
   a. base.css.ejs        → スライド基本レイアウト、フォント、サイズ
   b. header-footer.css.ejs → ヘッダー/フッター 3分割レイアウト
   c. cover.css.ejs        → 表紙スライドデザイン
   d. section-divider.css.ejs → セクション区切りデザイン
   e. end.css.ejs          → 最終ページデザイン
4. 全テンプレート出力を結合
5. 先頭に /* @theme corporate */ メタデータを付与
6. 一時ファイルに書き出し
```

#### CSS テンプレート構造

```
themes/templates/
├── base.css.ejs            # ←  :root 変数、section 基本スタイル
├── header-footer.css.ejs   # ←  header/footer grid レイアウト
├── cover.css.ejs           # ←  section.cover スタイル
├── section-divider.css.ejs # ←  section.section-divider スタイル
└── end.css.ejs             # ←  section.end スタイル
```

#### ヘッダー/フッター 3分割実現方式

Marp の `header` / `footer` ディレクティブに HTML を埋め込み、CSS Grid で3分割する。

**Markdown 側 (前処理後):**
```yaml
header: '<span class="hl">左</span><span class="hc">中央</span><span class="hr">右</span>'
footer: '<span class="fl">© Corp.</span><span class="fc"></span><span class="fr">CompanyName　5</span>'
```

**CSS 側:**
```css
header, footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  width: 100%;
}
header .hl, footer .fl { justify-self: start; }
header .hc, footer .fc { justify-self: center; }
header .hr, footer .fr { justify-self: end; }
```

> Marp の `html: true` 設定が前提。

### 2.3 Markdown Preprocessor (`src/preprocessor/`)

#### section-detector.ts — 自動セクション検出

```
入力: string (Markdown テキスト)
出力: Section[] (検出されたセクション一覧)

interface Section {
  index: number;        // セクション番号 (1, 2, 3...)
  title: string;        // セクション名
  startLine: number;    // 開始行番号
  endLine: number;      // 終了行番号
  content: string;      // セクション内コンテンツ
}

アルゴリズム:
1. Markdown を行単位で走査
2. /^## / にマッチする行をセクション境界として検出
3. 既に <!-- _class: --> ディレクティブがある行はスキップ
4. 各セクションの範囲とタイトルを記録
5. セクション番号を自動採番 (01, 02, ...)
```

#### directive-injector.ts — ディレクティブ注入

```
入力: string (Markdown), Section[], CorporateConfig
出力: string (ディレクティブ注入済み Markdown)

処理:
1. YAML front-matter を生成 (marp: true, theme: corporate, paginate: true, header, footer)
2. auto_cover=true の場合:
   - 先頭の # 見出し + ## 見出しを表紙スライドとして抽出
   - <!-- _class: cover --> と <!-- _paginate: false --> を付与
3. 各セクション境界にセクション区切りスライドを挿入:
   - <!-- _class: section-divider --> と <!-- _paginate: false --> を付与
4. セクション内コンテンツの ### 見出し等をスライド区切り (---) で分割
5. auto_end=true の場合:
   - 末尾に <!-- _class: end --> スライドを追加
6. hide_on に該当するスライドに <!-- _paginate: false --> を付与
```

#### template-vars.ts — テンプレート変数展開

```
入力: string (Markdown), CorporateConfig
出力: string (変数展開済み Markdown)

展開対象:
  {{logo}}          → <img src="logo.png" width="150px">
  {{company_name}}  → footer.company_name の値
  {{gradient:xxx}}  → linear-gradient(...) の CSS 値
  {{primary}}       → アクティブパレットの primary 色
  {{page}} / {{total}} → Marp の paginate 機能に委譲 (CSS で位置制御)
```

### 2.4 Marp CLI Wrapper (`src/runner/`)

#### marp-runner.ts

```
入力: processedMarkdownPath, themeCssPath, outputPath, format
出力: void (ファイル出力)

処理:
1. 出力ファイル拡張子から形式を判定 (.pdf / .pptx / .html)
2. Marp CLI コマンドを構築:
   marp --theme <themeCssPath> --html true <processedMarkdownPath> -o <outputPath>
3. PDF の場合: --pdf オプション追加
4. PPTX の場合: --pptx オプション追加
5. child_process.execSync で実行
6. 一時ファイルをクリーンアップ
```

---

## 3. プロジェクト構造

```
slide-creator/
├── package.json
├── tsconfig.json
├── README.md
├── docs/
│   ├── specification.md           # 本仕様書
│   └── design.md                  # 本設計書
├── corporate-config.yaml          # デフォルト設定ファイル
├── assets/
│   └── logo.png                   # サンプルロゴ
├── prompts/
│   └── slide-convert.md           # AI ツール向けプロンプト
├── src/
│   ├── index.ts                   # CLI エントリポイント
│   ├── config/
│   │   ├── schema.ts              # Zod スキーマ + TypeScript 型定義
│   │   ├── loader.ts              # YAML 読み込み & バリデーション
│   │   └── defaults.ts            # デフォルト値定義
│   ├── theme/
│   │   ├── generator.ts           # CSS テーマ生成ロジック
│   │   └── templates/
│   │       ├── base.css.ejs
│   │       ├── header-footer.css.ejs
│   │       ├── cover.css.ejs
│   │       ├── section-divider.css.ejs
│   │       └── end.css.ejs
│   ├── preprocessor/
│   │   ├── preprocessor.ts        # 前処理統合
│   │   ├── section-detector.ts    # 自動セクション検出
│   │   ├── directive-injector.ts  # ディレクティブ注入
│   │   └── template-vars.ts       # テンプレート変数展開
│   └── runner/
│       └── marp-runner.ts         # Marp CLI ラッパー
├── examples/
│   └── sample-slides.md           # サンプルスライド原稿
└── tests/
    ├── config.test.ts
    ├── theme-generator.test.ts
    ├── section-detector.test.ts
    └── preprocessor.test.ts
```

---

## 4. 技術スタック

| 要素 | 選定 | バージョン | 理由 |
|---|---|---|---|
| 言語 | TypeScript | 5.x | 型安全性、設定スキーマの型定義 |
| ランタイム | Node.js | 20+ LTS | Marp CLI の動作要件 |
| CLI フレームワーク | Commander.js | 12.x | 軽量、Node.js CLI の標準的選択 |
| YAML パーサー | js-yaml | 4.x | 標準的で安定 |
| テンプレートエンジン | EJS | 3.x | 最も広く使われるベストプラクティス、CSS 生成に十分 |
| バリデーション | Zod | 3.x | ランタイム型検証 + TypeScript 型推論 |
| スライド変換 | @marp-team/marp-cli | latest | Marp 公式 CLI |
| テスト | Vitest | 2.x | 高速、TypeScript ネイティブ |
| ビルド | tsup | latest | TypeScript バンドラー |

---

## 5. CLI インターフェース設計

```
slide-creator <command> [options]

Commands:
  build <input>       Markdown からスライドを生成
  init                設定ファイルとプロンプトのテンプレートを初期化

Build Options:
  -c, --config <path>       設定ファイルパス (default: ./corporate-config.yaml)
  -o, --output <path>       出力ファイルパス (.pdf/.pptx/.html)
  --palette <name>          カラーパレットを一時的に切り替え
  --no-auto-cover           表紙の自動挿入を無効化
  --no-auto-end             最終ページの自動挿入を無効化
  --no-auto-section         セクション自動検出を無効化
  --watch                   ファイル監視モード

Global Options:
  -h, --help                ヘルプ表示
  -v, --version             バージョン表示
```

---

## 6. 設定ファイル完全スキーマ (`corporate-config.yaml`)

```yaml
# ===== 基本設定 =====
slide:
  size: "16:9"

# ===== カラーパレット =====
colors:
  active: "fujifilm"
  palettes:
    fujifilm:
      primary: "#00A78E"
      secondary: "#005A57"
      accent: "#E87722"
      negative: "#C00000"
      background: "#FFFFFF"
      text: "#333333"
      muted: "#999999"
      gradients:
        - { name: "header", direction: "to right", stops: ["#00A78E", "#005A57"] }
        - { name: "cover-line", direction: "to right", stops: ["#00A78E", "#00C9A7"] }
        - { name: "section-bg", direction: "135deg", stops: ["#F8F9FA", "#FFFFFF"] }
        - { name: "accent", direction: "to right", stops: ["#E87722", "#FF9A4D"] }
        - { name: "subtle", direction: "to bottom", stops: ["#F5F5F5", "#EEEEEE"] }

# ===== ロゴ =====
logo:
  path: "./assets/logo.png"
  width: "150px"
  position: "footer-right"

# ===== ヘッダー =====
header:
  height: "40px"
  left: ""
  center: ""
  right: "{{nav_tabs}}"
  background: "transparent"
  color: "#333333"

# ===== フッター =====
footer:
  height: "36px"
  left: ""
  center: ""
  right: "{{company_name}}　{{page}}"
  background: "transparent"
  color: "#666666"
  company_name: "FUJIFILM Holdings Corporation"

# ===== ページ番号 =====
pagination:
  enabled: true
  format: "{{page}}"
  position: "footer-right"
  hide_on: ["cover", "end"]
  start_from: 2

# ===== 余白 =====
margin:
  top: "60px"
  bottom: "50px"
  left: "50px"
  right: "50px"

# ===== 特殊スライド =====
special_slides:
  cover:
    background: "#FFFFFF"
    title_color: "#333333"
    title_align: "left"
    show_accent_line: true
    accent_line_color: "{{gradient:cover-line}}"
    show_logo: true
    logo_position: "bottom-right"

  section_divider:
    background: "#FFFFFF"
    title_color: "{{primary}}"
    show_section_number: true
    number_color: "#E0E0E0"
    show_nav_tabs: true
    separator_line: true

  end:
    background: "#FFFFFF"
    show_logo: true
    logo_position: "center"
    show_tagline: true
    tagline: "Value from Innovation"

# ===== 自動構造化 =====
auto_structure:
  enabled: true
  section_heading_level: 2
  auto_cover: true
  auto_end: true

# ===== AI プロンプト =====
ai_prompt:
  path: "./prompts/slide-convert.md"
```

---

## 7. 参考: FUJIFILM IR スライド デザイン分析

### 7.1 表紙 (Page 1)

- 白背景
- タイトル: 黒太字、左寄せ
- タイトル下にティール色 (`#00A78E`) の水平ライン
- 日付 + 会社名: 左寄せ、通常フォント
- 右下にロゴ
- ページ番号なし

### 7.2 目次 / Agenda (Page 2)

- 左上にスライドタイトル「Agenda」
- セクション番号 (1, 2, 3) + ティール色の太い縦バー
- セクション名: ティール色太字
- 補足テキスト: グレー通常フォント

### 7.3 セクション区切り (Page 3)

- 右上にナビゲーションタブ（斜め台形、アクティブが濃い色）
- 薄い水平線
- 左半分: ティール色セクション名
- 右半分: 大きなグレー番号 (01)、グレー縦線で区切り

### 7.4 通常コンテンツ (Page 4-32)

- 右上にナビタブ
- 左上にスライドタイトル（黒太字）
- ティール色の見出しバー
- 数値ハイライト: オレンジ `#E87722` / 赤 `#C00000`
- フッター右: 会社名 + ページ番号

### 7.5 最終ページ (Page 33)

- 白背景
- 中央にロゴ + "Value from Innovation" タグライン
- ページ番号なし
