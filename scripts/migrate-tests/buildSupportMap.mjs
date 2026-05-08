/* eslint-disable no-console */
/**
 * 生成支撑文件迁移映射表：tests/ 下所有非 *.test.ts(x) 文件 → src/__test_helpers__/<...>
 *
 * 局部支撑文件（与具体组件强耦合的 testUtils）则归到对应组件的 __tests__/ 下，
 * 而非全局 helpers。
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const testsRoot = path.join(repoRoot, 'tests');
const srcRoot = path.join(repoRoot, 'src');
const helpersRel = '__test_helpers__';
const helpersAbs = path.join(srcRoot, helpersRel);

/**
 * 局部支撑文件 → 归属组件目录的 __tests__/ 下
 * 规则与 buildMigrationMap.mjs 中类似：tests/<X>/...sub/file → src/<X>/__tests__/...sub/file
 */
const localSupportRules = [
  // tests/MarkdownEditor/editor/elements/TestSlateWrapper.tsx → src/MarkdownEditor/__tests__/editor/elements/TestSlateWrapper.tsx
  {
    match: /^MarkdownEditor\/(.+)$/,
    target: (m) => `MarkdownEditor/__tests__/${m[1]}`,
  },
  // tests/Workspace/RealtimeFollow/testUtils.tsx → src/Workspace/__tests__/RealtimeFollow/testUtils.tsx
  {
    match: /^Workspace\/(.+)$/,
    target: (m) => `Workspace/__tests__/${m[1]}`,
  },
  // tests/editor/** 在测试文件迁移里也归到 MarkdownEditor，所以支撑文件保持一致
  {
    match: /^editor\/(.+)$/,
    target: (m) => `MarkdownEditor/__tests__/editor/${m[1]}`,
  },
];

/**
 * 全局支撑文件 → src/__test_helpers__/<rel>
 * 默认所有非局部规则匹配的，都按原相对路径放到 helpers 下
 */
function buildGlobalTarget(relPosix) {
  // tests/setupTests.ts → src/__test_helpers__/setupTests.ts
  // tests/_mocks_/foo.ts → src/__test_helpers__/_mocks_/foo.ts
  // tests/utils/index.ts → src/__test_helpers__/utils/index.ts
  return path.join(helpersRel, relPosix);
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const allFiles = walk(testsRoot);
const supportFiles = allFiles.filter((f) => !/\.test\.tsx?$/.test(f));

const mappings = [];
const skipped = [];

for (const abs of supportFiles) {
  const rel = path.relative(testsRoot, abs);
  const relPosix = rel.split(path.sep).join('/');

  // tsconfig.json 不挪，直接删除（vitest 用根 tsconfig.test.json）
  if (relPosix === 'tsconfig.json') {
    skipped.push({ from: rel, reason: 'will-be-removed (tests/tsconfig.json)' });
    continue;
  }

  let targetRel = null;
  for (const rule of localSupportRules) {
    const m = relPosix.match(rule.match);
    if (m) {
      targetRel = rule.target(m);
      break;
    }
  }
  if (!targetRel) {
    targetRel = buildGlobalTarget(relPosix);
  }

  mappings.push({
    from: path.relative(repoRoot, abs),
    to: path.relative(repoRoot, path.join(srcRoot, targetRel)),
    isLocal: !targetRel.startsWith(helpersRel),
  });
}

const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'support-mappings.json'),
  JSON.stringify(mappings, null, 2),
);

console.log('=== Support File Mappings ===');
console.log('Total:', supportFiles.length);
console.log('Mapped:', mappings.length);
console.log('Skipped:', skipped.length);
for (const m of mappings) {
  console.log(`  ${m.from}  →  ${m.to}${m.isLocal ? '  (local)' : ''}`);
}
for (const s of skipped) {
  console.log(`  [skip] ${s.from}: ${s.reason}`);
}
console.log('Output: scripts/migrate-tests/out/support-mappings.json');
