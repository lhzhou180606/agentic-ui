/* eslint-disable no-console */
/**
 * 主迁移执行脚本：
 *  1. 读取 mappings.json（测试文件迁移）和 support-mappings.json（支撑文件迁移）
 *  2. 用 git mv 真正移动文件（保留 git history）
 *  3. 不在此脚本里改 import，import 重写交给 rewriteImports.mjs
 *
 * 使用：
 *   node scripts/migrate-tests/runMigration.mjs --dry-run   # 预演（默认，输出将执行的命令）
 *   node scripts/migrate-tests/runMigration.mjs --apply     # 真正执行 git mv
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outDir = path.join(__dirname, 'out');

const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';

const testMappings = JSON.parse(
  fs.readFileSync(path.join(outDir, 'mappings.json'), 'utf8'),
);
const supportMappings = JSON.parse(
  fs.readFileSync(path.join(outDir, 'support-mappings.json'), 'utf8'),
);

const allMappings = [...supportMappings, ...testMappings];

function ensureDir(file) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** 冲突时给目标文件加后缀，区分两份测试以便后续人工合并 */
function withConflictSuffix(toRel) {
  const ext = path.extname(toRel); // .tsx / .ts
  const base = toRel.slice(0, -ext.length);
  return `${base}.from-tests${ext}`;
}

function gitMv(from, to) {
  const fromAbs = path.join(repoRoot, from);
  let actualTo = to;
  let toAbs = path.join(repoRoot, actualTo);
  if (!fs.existsSync(fromAbs)) {
    console.warn(`[skip] not exist: ${from}`);
    return false;
  }
  if (fs.existsSync(toAbs)) {
    actualTo = withConflictSuffix(to);
    toAbs = path.join(repoRoot, actualTo);
    if (fs.existsSync(toAbs)) {
      console.warn(`[skip] both target & .from-tests exist: ${to}`);
      return false;
    }
    console.log(`[conflict→suffix] ${from}  →  ${actualTo}`);
  }
  ensureDir(toAbs);
  try {
    execFileSync('git', ['mv', from, actualTo], { cwd: repoRoot, stdio: 'pipe' });
    return true;
  } catch (err) {
    fs.renameSync(fromAbs, toAbs);
    return true;
  }
}

let okCount = 0;
let skipCount = 0;
const conflicts = [];

if (mode === 'dry-run') {
  console.log('=== DRY RUN ===');
  for (const { from, to } of allMappings) {
    const fromAbs = path.join(repoRoot, from);
    const toAbs = path.join(repoRoot, to);
    if (!fs.existsSync(fromAbs)) {
      console.log(`[missing-source] ${from}`);
      continue;
    }
    if (fs.existsSync(toAbs)) {
      conflicts.push({ from, to });
      console.log(`[conflict] ${to} already exists`);
      continue;
    }
    console.log(`mv ${from}  →  ${to}`);
  }
  console.log(`\nWould move: ${allMappings.length - conflicts.length}`);
  console.log(`Conflicts: ${conflicts.length}`);
  if (conflicts.length) {
    fs.writeFileSync(
      path.join(outDir, 'conflicts.json'),
      JSON.stringify(conflicts, null, 2),
    );
    console.log(`Conflicts dumped to out/conflicts.json`);
  }
  console.log('\nUse --apply to actually move files.');
} else {
  console.log('=== APPLY ===');
  for (const { from, to } of allMappings) {
    const ok = gitMv(from, to);
    if (ok) okCount++;
    else skipCount++;
  }
  console.log(`\nMoved: ${okCount}, Skipped: ${skipCount}`);
}
