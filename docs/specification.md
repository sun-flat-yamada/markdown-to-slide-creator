# slide-creator 仕様書

> **文書ID**: SPEC-001  
> **バージョン**: 1.0  
> **作成日**: 2026-02-10  
> **ステータス**: 承認済み

---

## 1. 概要

### 1.1 目的

Marp (Markdown Presentation Ecosystem) をベースに、**Corporate デザインをパラメーターで指定可能なスライド生成 CLI ツール** `slide-creator` を構築する。

### 1.2 スコープ

- Markdown 原稿から PDF / PPTX 形式のプレゼンテーションを生成
- Corporate デザイン（色、レイアウト、ロゴ等）を YAML 設定ファイルで一元管理
- `##` レベル見出しによる自動セクション検出と構造化
- AI ツール（GitHub Copilot / Antigravity）との連携を前提としたプロンプトファイル提供

### 1.3 参考資料

- FUJIFILM Holdings Corporation IR スライド (Earnings Presentation, Q1 FY2025)
- Marp 公式ドキュメント: https://marp.app/
- Marpit テーマ CSS: https://marpit.marp.app/theme-css

---

## 2. 機能要件

### 2.1 パラメーター化項目

以下のデザイン要素を `corporate-config.yaml` で指定可能とする。

#### 2.1.1 ヘッダー部

| パラメーター | 説明 | 型 |
|---|---|---|
| `header.height` | ヘッダー高さ | `string` (CSS単位) |
| `header.left` | 左側コンテンツ | `string` (テキスト / Markdown / テンプレート変数) |
| `header.center` | 中央コンテンツ | `string` |
| `header.right` | 右側コンテンツ | `string` |
| `header.background` | 背景色 / グラデーション | `string` |
| `header.color` | テキスト色 | `string` |

#### 2.1.2 フッター部

| パラメーター | 説明 | 型 |
|---|---|---|
| `footer.height` | フッター高さ | `string` (CSS単位) |
| `footer.left` | 左側コンテンツ | `string` |
| `footer.center` | 中央コンテンツ | `string` |
| `footer.right` | 右側コンテンツ | `string` |
| `footer.background` | 背景色 | `string` |
| `footer.color` | テキスト色 | `string` |
| `footer.company_name` | 会社名 | `string` |

> **3分割レイアウト**: ヘッダー・フッターはそれぞれ左・中央・右の3区分を `CSS Grid` で実現する。

#### 2.1.3 ページ番号

| パラメーター | 説明 | 型 |
|---|---|---|
| `pagination.enabled` | ページ番号の有効/無効 | `boolean` |
| `pagination.format` | 表示フォーマット | `string` (`{{page}}`, `{{total}}` 使用可) |
| `pagination.position` | 配置位置 | `string` |
| `pagination.hide_on` | 非表示とするスライド種別 | `string[]` |
| `pagination.start_from` | 開始番号 | `number` |

> **実現方式**: Marp 標準の `paginate: true` + CSS による位置再配置（方式A）を採用する。

#### 2.1.4 カラーパレット

| パラメーター | 説明 | 型 |
|---|---|---|
| `colors.active` | 使用パレット名 | `string` |
| `colors.palettes.<name>.primary` | 基本色 | `string` (CSS色) |
| `colors.palettes.<name>.secondary` | セカンダリ色 | `string` |
| `colors.palettes.<name>.accent` | アクセント色 | `string` |
| `colors.palettes.<name>.negative` | ネガティブ値色 | `string` |
| `colors.palettes.<name>.background` | 背景色 | `string` |
| `colors.palettes.<name>.text` | テキスト色 | `string` |
| `colors.palettes.<name>.muted` | 非アクティブ色 | `string` |
| `colors.palettes.<name>.gradients` | グラデーション配列 | `Gradient[]` |

**拡張性**: `palettes` オブジェクト配下に任意のキーで新パレットを追加可能。コード変更不要。

**グラデーション**: 各パレットに5つのグラデーション（`header`, `cover-line`, `section-bg`, `accent`, `subtle`）を定義。追加も自由。

#### 2.1.5 特殊スライドデザイン

| スライド種別 | class 名 | 説明 |
|---|---|---|
| **表紙** | `cover` | タイトル、サブタイトル、アクセント水平ライン、ロゴ |
| **セクション区切り** | `section-divider` | セクション名、セクション番号(大文字)、ナビタブ |
| **最終ページ** | `end` | ロゴ中央配置、タグライン |

各スライド種別のデザインパラメーターは `special_slides.<type>` 配下で個別指定可能。

#### 2.1.6 その他

| パラメーター | 説明 | 型 |
|---|---|---|
| `slide.size` | 用紙サイズ | `string` / `{ width, height }` |
| `logo.path` | ロゴ画像パス | `string` |
| `logo.width` | ロゴ表示幅 | `string` |
| `logo.position` | ロゴ配置位置 | `string` |
| `margin.top` | 上余白 | `string` |
| `margin.bottom` | 下余白 | `string` |
| `margin.left` | 左余白 | `string` |
| `margin.right` | 右余白 | `string` |

### 2.2 自動セクション検出

| 要件ID | 説明 |
|---|---|
| AUTO-01 | `##` レベルの見出しをセクション境界として自動検出する |
| AUTO-02 | 検出したセクションの先頭にセクション区切りスライドを自動挿入する |
| AUTO-03 | セクション番号を自動採番する (01, 02, 03...) |
| AUTO-04 | 先頭に表紙スライドを自動挿入する（`auto_cover: false` で無効化可） |
| AUTO-05 | 末尾に最終ページスライドを自動挿入する（`auto_end: false` で無効化可） |
| AUTO-06 | 手動でディレクティブ（`<!-- _class: xxx -->`）が指定されている場合は自動検出より優先する |

### 2.3 AI ツール連携

| 要件ID | 説明 |
|---|---|
| AI-01 | `prompts/slide-convert.md` として Markdown → スライド変換用プロンプトファイルを提供する |
| AI-02 | プロンプトファイルはユーザーがカスタマイズ可能とする |
| AI-03 | `corporate-config.yaml` の `ai_prompt.path` で参照先を変更可能とする |
| AI-04 | プロンプトには構造ルール（見出しレベル、スライド分割、テキスト量）を定義する |

### 2.4 出力形式

| 優先度 | 形式 | 説明 |
|---|---|---|
| 1 | **PDF** | 配布・印刷用。Marp CLI の Chrome/Chromium 連携で生成 |
| 2 | **PPTX** | 編集可能な PowerPoint 形式。Marp CLI ネイティブサポート |
| 3 | HTML | ブラウザプレゼン用（将来対応） |

---

## 3. 非機能要件

| 要件ID | カテゴリ | 説明 |
|---|---|---|
| NFR-01 | 拡張性 | カラーパレットの追加は YAML 編集のみで完了すること |
| NFR-02 | 拡張性 | 新スライドレイアウトの追加は CSS テンプレート追加 + YAML 設定追加で完了すること |
| NFR-03 | 保守性 | 設定スキーマは Zod で型定義し、不正な設定を起動時にバリデーションすること |
| NFR-04 | 互換性 | Marp 標準の Markdown 記法に準拠すること |
| NFR-05 | 互換性 | 手動ディレクティブ方式との後方互換性を維持すること |
| NFR-06 | UX | `--init` コマンドで設定テンプレートとプロンプトを初期生成できること |

---

## 4. テンプレート変数一覧

設定ファイルおよびヘッダー/フッター内で使用可能なテンプレート変数：

| 変数 | 展開先 |
|---|---|
| `{{page}}` | 現在のページ番号 |
| `{{total}}` | 総ページ数 |
| `{{logo}}` | ロゴ画像の `<img>` タグ |
| `{{company_name}}` | `footer.company_name` の値 |
| `{{nav_tabs}}` | セクションナビゲーションタブ HTML |
| `{{gradient:<name>}}` | 指定名のグラデーション CSS 値 |
| `{{primary}}` | アクティブパレットの primary 色 |
| `{{secondary}}` | アクティブパレットの secondary 色 |
| `{{accent}}` | アクティブパレットの accent 色 |
