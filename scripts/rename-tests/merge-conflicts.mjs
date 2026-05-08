#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * 物理合并 8 处冲突的测试文件
 *
 * 策略：保留各 describe 块独立，去掉重复 import，把"被合并方"的剩余内容
 * 追加到"目标方"末尾，git rm 被合并方
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, '../..');

// 合并计划
const MERGE_PLAN = [
  // Cluster D: elements perf
  {
    target: 'src/MarkdownEditor/__tests__/editor/elements.benchmark.test.tsx',
    sources: [
      'src/MarkdownEditor/__tests__/editor/elements.performance.test.tsx',
    ],
  },
  // Cluster C: BarChart
  {
    target: 'src/Plugins/chart/__tests__/BarChart.branches.test.tsx',
    sources: ['src/Plugins/chart/__tests__/BarChart.coverage.test.tsx'],
  },
  // Cluster B: SchemaRenderer
  // 目标 .branches 不存在，需要先 git mv comprehensive → branches，再合并 targeted-coverage
  {
    target: 'src/Schema/SchemaRenderer/__tests__/SchemaRenderer.branches.test.tsx',
    initFromRename: 'src/Schema/SchemaRenderer/__tests__/SchemaRenderer.comprehensive.test.tsx',
    sources: [
      'src/Schema/SchemaRenderer/__tests__/SchemaRenderer.targeted-coverage.test.tsx',
    ],
  },
  // Cluster A: MarkdownInputField (4-way merge)
  // .assertions → 主文件; .comprehensive/.enhanced/.targeted-coverage → .branches
  {
    target: 'src/MarkdownInputField/__tests__/MarkdownInputField.test.tsx',
    sources: [
      'src/MarkdownInputField/__tests__/MarkdownInputField.assertions.test.tsx',
    ],
  },
  {
    target: 'src/MarkdownInputField/__tests__/MarkdownInputField.branches.test.tsx',
    initFromRename: 'src/MarkdownInputField/__tests__/MarkdownInputField.comprehensive.test.tsx',
    sources: [
      'src/MarkdownInputField/__tests__/MarkdownInputField.enhanced.test.tsx',
      'src/MarkdownInputField/__tests__/MarkdownInputField.targeted-coverage.test.tsx',
    ],
  },
];

/**
 * 简单提取一个 .tsx 文件的「内容主体」：
 * - 跳过文件顶部连续的 import 行 / "use ..." / 块注释 / 空行
 * - 返回剩余的代码主体
 */
function stripImports(content) {
  const lines = content.split('\n');
  let i = 0;
  let inBlockComment = false;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      i += 1;
      continue;
    }
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) inBlockComment = true;
      i += 1;
      continue;
    }
    if (line === '' || line.startsWith('//')) {
      i += 1;
      continue;
    }
    if (line.startsWith('import ')) {
      // import 可能跨行，读到分号
      while (i < lines.length && !lines[i].includes(';')) i += 1;
      i += 1;
      continue;
    }
    // 遇到第一行非 import / 非注释代码
    break;
  }
  return lines.slice(i).join('\n').trim() + '\n';
}

/**
 * 从源文件提取 import 段（保留以便补到 target 顶部）
 */
function extractImports(content) {
  const lines = content.split('\n');
  const imports = [];
  let i = 0;
  let inBlockComment = false;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      i += 1;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      i += 1;
      continue;
    }
    if (trimmed === '' || trimmed.startsWith('//')) {
      i += 1;
      continue;
    }
    if (trimmed.startsWith('import ')) {
      const start = i;
      while (i < lines.length && !lines[i].includes(';')) i += 1;
      imports.push(lines.slice(start, i + 1).join('\n'));
      i += 1;
      continue;
    }
    break;
  }
  return imports;
}

/**
 * 从 target 已有 imports 集合中合并新 imports，去重（按整行精确匹配）
 */
function mergeImports(targetContent, newImports) {
  const existing = new Set(extractImports(targetContent).map((s) => s.trim()));
  const toAdd = newImports.filter((s) => !existing.has(s.trim()));
  if (!toAdd.length) return targetContent;

  // 找到最后一个 import 的位置，在其后插入
  const lines = targetContent.split('\n');
  let lastImportLine = -1;
  let i = 0;
  let inBlockComment = false;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      i += 1;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      i += 1;
      continue;
    }
    if (trimmed.startsWith('import ')) {
      while (i < lines.length && !lines[i].includes(';')) i += 1;
      lastImportLine = i;
      i += 1;
      continue;
    }
    if (trimmed === '' || trimmed.startsWith('//')) {
      i += 1;
      continue;
    }
    break;
  }
  if (lastImportLine === -1) return [toAdd.join('\n'), targetContent].join('\n\n');
  const before = lines.slice(0, lastImportLine + 1);
  const after = lines.slice(lastImportLine + 1);
  return [...before, ...toAdd, ...after].join('\n');
}

let okCount = 0;
let failCount = 0;
const errors = [];

for (const job of MERGE_PLAN) {
  try {
    const targetAbs = path.join(REPO, job.target);

    // 1. 如果 target 是新文件名（.branches 还不存在），先从 initFromRename 文件 git mv 创建
    if (job.initFromRename && !fs.existsSync(targetAbs)) {
      const fromAbs = path.join(REPO, job.initFromRename);
      if (!fs.existsSync(fromAbs)) {
        throw new Error(`initFromRename 源不存在: ${job.initFromRename}`);
      }
      execSync(`git mv "${fromAbs}" "${targetAbs}"`, { cwd: REPO, stdio: 'pipe' });
      console.log(`✅ [init] ${job.initFromRename}\n     → ${job.target}`);
    }

    // 2. 逐个合并 source
    for (const src of job.sources) {
      const srcAbs = path.join(REPO, src);
      if (!fs.existsSync(srcAbs)) {
        throw new Error(`源文件不存在: ${src}`);
      }
      const srcContent = fs.readFileSync(srcAbs, 'utf-8');
      const targetContent = fs.readFileSync(targetAbs, 'utf-8');

      const srcImports = extractImports(srcContent);
      const srcBody = stripImports(srcContent);

      // 合并 imports + 在末尾追加分隔注释 + body
      const merged =
        mergeImports(targetContent, srcImports).replace(/\n+$/, '') +
        '\n\n' +
        '// '.padEnd(78, '=') +
        '\n' +
        `// === merged from ${path.basename(src)} ===\n` +
        '// '.padEnd(78, '=') +
        '\n\n' +
        srcBody;

      fs.writeFileSync(targetAbs, merged);
      execSync(`git rm "${srcAbs}"`, { cwd: REPO, stdio: 'pipe' });
      console.log(`✅ [merge] ${src}\n     → appended to ${job.target}`);
    }

    okCount += 1;
  } catch (e) {
    failCount += 1;
    errors.push({ target: job.target, error: e.message });
    console.error(`❌ FAIL ${job.target}: ${e.message}`);
  }
}

console.log(`\n=== 完成: ${okCount} 成功, ${failCount} 失败 ===`);
if (errors.length) {
  for (const e of errors) console.log(`  - ${e.target}: ${e.error}`);
}
