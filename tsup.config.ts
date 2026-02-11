import { defineConfig } from 'tsup';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  onSuccess: async () => {
    const src = path.join(__dirname, 'src/theme/templates');
    const dest = path.join(__dirname, 'dist/templates');

    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true });
      console.log('[tsup] Copied templates to dist/templates');
    } else {
      console.warn('[tsup] Template directory not found at:', src);
    }
  },
});
