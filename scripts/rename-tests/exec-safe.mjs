#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * 执行安全类 git mv（跳过冲突文件）
 * 输入：./out/rename-plan.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, '../..');
const planPath = path.join(__dirname, 'out', 'rename-plan.json');

const { plans } = JSON.parse(fs.readFileSync(planPath, 'utf-8'));

const safe = plans.filter(
  (p) => p.action !== 'keep' && !p.conflict && p.from !== p.to,
);

console.log(`总计 ${safe.length} 个安全文件待执行 git mv\n`);

let ok = 0;
let fail = 0;
const errors = [];

for (const p of safe) {
  const fromAbs = path.join(REPO, p.from);
  const toAbs = path.join(REPO, p.to);
  const toDir = path.dirname(toAbs);

  try {
    if (!fs.existsSync(fromAbs)) {
      throw new Error(`源文件不存在: ${p.from}`);
    }
    if (fs.existsSync(toAbs)) {
      throw new Error(`目标已存在（dry-run 漏检冲突）: ${p.to}`);
    }
    fs.mkdirSync(toDir, { recursive: true });
    execSync(`git mv "${fromAbs}" "${toAbs}"`, { cwd: REPO, stdio: 'pipe' });
    ok += 1;
  } catch (e) {
    fail += 1;
    errors.push({ from: p.from, to: p.to, error: e.message });
  }
}

console.log(`✅ 成功: ${ok}`);
console.log(`❌ 失败: ${fail}`);
if (errors.length) {
  console.log('\n失败详情：');
  for (const e of errors) {
    console.log(`  ${e.from}\n    → ${e.to}\n    ❌ ${e.error}`);
  }
}
