/**
 * 扫描并移除 UTF-8 BOM（EF BB BF），避免 JSON.parse / 构建工具报 Unexpected token ﻿。
 *
 * 用法：
 *   node scripts/strip-utf8-bom.mjs           # 写回清理
 *   node scripts/strip-utf8-bom.mjs --dry-run # 仅列出
 *   node scripts/strip-utf8-bom.mjs --check   # CI：有 BOM 则 exit 1
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const GLOB_PATTERNS = [
  'src/**/*.{ts,tsx,js,jsx,mjs,cjs}',
  'docs/**/*.{ts,tsx,js,jsx,md}',
  'scripts/**/*.{js,mjs,ts}',
  'tests/**/*.{ts,tsx,js}',
  'e2e/**/*.{ts,tsx}',
  '*.{json,md,ts,js,mjs}',
  '.github/**/*.{yml,yaml}',
  '.npmrc',
  '.eslintrc.js',
  '.prettierrc.js',
  '.dumirc.ts',
  '.fatherrc.ts',
  'vitest.config.ts',
  'playwright.config.ts',
  'tsconfig.json',
];

const IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.git/**',
  '**/.dumi/**',
  '**/coverage/**',
  '**/playwright-report/**',
  '**/.pnpm-store/**',
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const checkOnly = args.has('--check');

if (args.has('--help') || args.has('-h')) {
  // eslint-disable-next-line no-console
  console.log(`strip-utf8-bom — remove UTF-8 BOM from source files

  node scripts/strip-utf8-bom.mjs           write fixes
  node scripts/strip-utf8-bom.mjs --dry-run list paths only
  node scripts/strip-utf8-bom.mjs --check   exit 1 if any BOM remains
`);
  process.exit(0);
}

/** @param {Buffer} buf */
function hasUtf8Bom(buf) {
  return buf.length >= 3 && buf[0] === BOM[0] && buf[1] === BOM[1] && buf[2] === BOM[2];
}

/** @param {Buffer} buf */
function stripUtf8Bom(buf) {
  return hasUtf8Bom(buf) ? buf.subarray(3) : buf;
}

const files = globSync(GLOB_PATTERNS, {
  cwd: ROOT,
  absolute: true,
  ignore: IGNORE,
  nodir: true,
});

const withBom = [];

for (const file of files) {
  let buf;
  try {
    buf = readFileSync(file);
  } catch {
    continue;
  }
  if (!hasUtf8Bom(buf)) {
    continue;
  }
  const rel = relative(ROOT, file);
  withBom.push(rel);
  if (!checkOnly && !dryRun) {
    writeFileSync(file, stripUtf8Bom(buf));
  }
}

if (withBom.length === 0) {
  // eslint-disable-next-line no-console
  console.log('strip-utf8-bom: no UTF-8 BOM found');
  process.exit(0);
}

const mode = checkOnly ? 'check' : dryRun ? 'dry-run' : 'fixed';
// eslint-disable-next-line no-console
console.log(`strip-utf8-bom (${mode}): ${withBom.length} file(s)`);
for (const p of withBom) {
  // eslint-disable-next-line no-console
  console.log(`  ${p}`);
}

if (checkOnly) {
  process.exit(1);
}
