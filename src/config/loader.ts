import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { CorporateConfigSchema, type CorporateConfig } from './schema.js';

/**
 * YAML 設定ファイルを読み込み、バリデーションして CorporateConfig を返す。
 */
export function loadConfig(configPath: string): CorporateConfig {
  const absolutePath = path.resolve(configPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`設定ファイルが見つかりません: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, 'utf-8');
  const parsed = yaml.load(raw);

  const result = CorporateConfigSchema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`設定ファイルのバリデーションエラー:\n${errors}`);
  }

  return result.data;
}

/**
 * アクティブなカラーパレットを取得する。
 */
export function getActivePalette(config: CorporateConfig) {
  const palette = config.colors.palettes[config.colors.active];
  if (!palette) {
    throw new Error(
      `パレット "${config.colors.active}" が見つかりません。` +
      `利用可能: ${Object.keys(config.colors.palettes).join(', ')}`
    );
  }
  return palette;
}
