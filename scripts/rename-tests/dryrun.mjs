#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * 测试文件命名治理 - dry-run 清单生成器
 *
 * 输入：扫描 src/ 下所有 *.test.ts(x)
 * 输出：./out/rename-plan.json + ./out/rename-plan.md
 * 不修改任何文件
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, '../..');
const SRC = path.join(REPO, 'src');
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

// ─────────────────────────────────────────────────────────────
// 规约（与用户拍板一致）
// ─────────────────────────────────────────────────────────────

// 保留的 10 类后缀
const KEEP = new Set([
  'basic',
  'advanced',
  'branches',
  'regression',
  'ssr',
  'lazy',
  'integration',
  'i18n',
  'benchmark',
]);

// 后缀直接重命名映射
const RENAME_SUFFIX = {
  // 各类补洞 → branches
  coverage: 'branches',
  targeted: 'branches',
  'targeted-coverage': 'branches',
  comprehensive: 'branches',
  'disabled-coverage': 'branches',
  enhanced: 'branches',
  // 性能
  performance: 'benchmark',
};

// 直接合并到主文件（删除后缀）
const MERGE_TO_MAIN = new Set(['base', 'unit', 'assertions']);

// 子场景类 → scenarios/ 子目录
const SCENARIO_SUFFIX = new Set([
  'voice',
  'visual',
  'theme',
  'table',
  'list',
  'card',
  'bubble',
  'bubblecontext',
  'dom',
  'console',
  'cache',
  'markdown',
  'jinja',
  'apaasify',
  'align',
  'keyboard',
  'safe',
  'revision',
  'fallback',
  'error-boundary',
  'streaming-stability',
  'streaming-chart-card-stability',
  'handlers',
  'sendButton', // 子场景：发送按钮场景
  'shouldShowCopy-onCancelLike', // 复合场景
]);

// 属性名后缀 → props/ 子目录
const PROPS_SUFFIX = new Set([
  'expandedKeys',
  'maxBarThickness',
  'actionsRender',
  'extraRender',
  'leafRender',
  'defaultIcon',
  'contentStyle',
  'renderMode',
  'originDataFlags',
]);

// 事件/方法名后缀 → events/ 子目录
const EVENTS_SUFFIX = new Set([
  'onSend',
  'onPaste',
  'onViewModeChange',
  'deleteBackward',
]);

// ─────────────────────────────────────────────────────────────
// 扫描
// ─────────────────────────────────────────────────────────────
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (/\.test\.tsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 推导新文件名（不含目录变更）
// ─────────────────────────────────────────────────────────────
function planForFile(absPath) {
  const rel = path.relative(REPO, absPath);
  const dir = path.dirname(rel);
  const base = path.basename(rel); // X.test.tsx 或 X.<suffix>.test.tsx
  const m = base.match(/^(.+?)\.test\.(tsx?)$/);
  if (!m) return null;
  const stem = m[1]; // X 或 X.<suffix>
  const ext = m[2];

  // 提取后缀（最后一个 .xxx）
  const dot = stem.lastIndexOf('.');
  const compName = dot === -1 ? stem : stem.slice(0, dot);
  const suffix = dot === -1 ? '' : stem.slice(dot + 1);

  // 1. 无后缀 → 不动
  if (!suffix) {
    return { from: rel, to: rel, action: 'keep', reason: '主测试文件' };
  }

  // 2. 已经在保留集合（且名字本身合法）
  if (KEEP.has(suffix)) {
    return { from: rel, to: rel, action: 'keep', reason: `合法后缀 .${suffix}` };
  }

  // 3. 直接重命名后缀
  if (RENAME_SUFFIX[suffix]) {
    const newSuffix = RENAME_SUFFIX[suffix];
    const newBase = `${compName}.${newSuffix}.test.${ext}`;
    return {
      from: rel,
      to: path.join(dir, newBase),
      action: 'rename-suffix',
      reason: `.${suffix} → .${newSuffix}`,
    };
  }

  // 4. 合并到主文件
  if (MERGE_TO_MAIN.has(suffix)) {
    const mainBase = `${compName}.test.${ext}`;
    return {
      from: rel,
      to: path.join(dir, mainBase),
      action: 'merge-to-main',
      reason: `.${suffix} 合并到主文件`,
    };
  }

  // 5. 挪到 scenarios/ 子目录
  if (SCENARIO_SUFFIX.has(suffix)) {
    return {
      from: rel,
      to: path.join(dir, 'scenarios', `${compName}.${suffix}.test.${ext}`),
      action: 'move-to-scenarios',
      reason: `子场景 .${suffix}`,
    };
  }

  // 6. 挪到 props/ 子目录
  if (PROPS_SUFFIX.has(suffix)) {
    return {
      from: rel,
      to: path.join(dir, 'props', `${compName}.${suffix}.test.${ext}`),
      action: 'move-to-props',
      reason: `属性测试 .${suffix}`,
    };
  }

  // 7. 挪到 events/ 子目录
  if (EVENTS_SUFFIX.has(suffix)) {
    return {
      from: rel,
      to: path.join(dir, 'events', `${compName}.${suffix}.test.${ext}`),
      action: 'move-to-events',
      reason: `事件测试 .${suffix}`,
    };
  }

  // 8. 兜底：人工 review
  return {
    from: rel,
    to: rel,
    action: 'NEEDS-REVIEW',
    reason: `未识别的后缀 .${suffix}`,
  };
}

// ─────────────────────────────────────────────────────────────
// 检测同目录下重名冲突（合并/改名后会撞）
// ─────────────────────────────────────────────────────────────
function detectConflicts(plans) {
  const targetCount = new Map();
  for (const p of plans) {
    if (p.action === 'keep') continue;
    targetCount.set(p.to, (targetCount.get(p.to) || 0) + 1);
  }
  // 加上"目标位置已经有同名 keep 文件"的情况
  const keepTargets = new Set(plans.filter((p) => p.action === 'keep').map((p) => p.to));
  for (const p of plans) {
    if (p.action === 'keep') continue;
    if (keepTargets.has(p.to) && p.to !== p.from) {
      targetCount.set(p.to, (targetCount.get(p.to) || 0) + 1);
    }
  }
  for (const p of plans) {
    if (p.action === 'keep') continue;
    if ((targetCount.get(p.to) || 0) > 1) {
      p.conflict = true;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 检测 import 引用（其他测试文件引用了被改名的文件）
// ─────────────────────────────────────────────────────────────
function findImportReferences(plans) {
  const renamedSet = new Set(plans.filter((p) => p.from !== p.to).map((p) => p.from));
  if (renamedSet.size === 0) return [];

  const refs = [];
  for (const file of walk(SRC)) {
    const rel = path.relative(REPO, file);
    let content;
    try {
      content = fs.readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    // 简单匹配 import 路径中是否含被改名文件的 stem
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const importPath = m[1];
      if (!importPath.startsWith('.')) continue;
      const resolved = path.normalize(
        path.join(path.dirname(rel), importPath),
      );
      // 尝试匹配 .test.tsx 或 .test.ts 后缀
      const candidates = [`${resolved}.test.tsx`, `${resolved}.test.ts`, resolved];
      for (const c of candidates) {
        if (renamedSet.has(c)) {
          refs.push({ inFile: rel, importPath, refersTo: c });
        }
      }
    }
  }
  return refs;
}

// ─────────────────────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────────────────────
const allFiles = [...walk(SRC)].sort();
const plans = allFiles.map(planForFile).filter(Boolean);
detectConflicts(plans);
const importRefs = findImportReferences(plans);

// 统计
const stats = {
  total: plans.length,
  keep: plans.filter((p) => p.action === 'keep').length,
  renameSuffix: plans.filter((p) => p.action === 'rename-suffix').length,
  mergeToMain: plans.filter((p) => p.action === 'merge-to-main').length,
  moveToScenarios: plans.filter((p) => p.action === 'move-to-scenarios').length,
  moveToProps: plans.filter((p) => p.action === 'move-to-props').length,
  moveToEvents: plans.filter((p) => p.action === 'move-to-events').length,
  needsReview: plans.filter((p) => p.action === 'NEEDS-REVIEW').length,
  conflicts: plans.filter((p) => p.conflict).length,
  importRefs: importRefs.length,
};

// 输出 JSON
fs.writeFileSync(
  path.join(OUT, 'rename-plan.json'),
  JSON.stringify({ stats, plans, importRefs }, null, 2),
);

// 输出 Markdown
const lines = [];
lines.push('# 测试文件命名治理 dry-run 清单');
lines.push('');
lines.push('## 统计');
lines.push('');
lines.push('| 项目 | 数量 |');
lines.push('|---|---|');
lines.push(`| 扫描总文件数 | ${stats.total} |`);
lines.push(`| 不变（已合规） | ${stats.keep} |`);
lines.push(`| 改后缀（→ .branches / .benchmark） | ${stats.renameSuffix} |`);
lines.push(`| 合并到主文件（.base/.unit/.assertions） | ${stats.mergeToMain} |`);
lines.push(`| 挪到 scenarios/ 子目录 | ${stats.moveToScenarios} |`);
lines.push(`| 挪到 props/ 子目录 | ${stats.moveToProps} |`);
lines.push(`| 挪到 events/ 子目录 | ${stats.moveToEvents} |`);
lines.push(`| ⚠️ 命名冲突（多个文件改名后撞名） | ${stats.conflicts} |`);
lines.push(`| ⚠️ 待人工 review（未识别后缀） | ${stats.needsReview} |`);
lines.push(`| 受影响 import 引用数 | ${stats.importRefs} |`);
lines.push('');

const groups = [
  ['rename-suffix', '改后缀'],
  ['merge-to-main', '合并到主文件'],
  ['move-to-scenarios', '挪到 scenarios/'],
  ['move-to-props', '挪到 props/'],
  ['move-to-events', '挪到 events/'],
  ['NEEDS-REVIEW', '待人工 review'],
];
for (const [action, title] of groups) {
  const items = plans.filter((p) => p.action === action);
  if (!items.length) continue;
  lines.push(`## ${title}（${items.length}）`);
  lines.push('');
  lines.push('| 旧路径 | 新路径 | 理由 | 冲突 |');
  lines.push('|---|---|---|---|');
  for (const p of items) {
    lines.push(
      `| \`${p.from}\` | \`${p.to}\` | ${p.reason} | ${p.conflict ? '⚠️ YES' : ''} |`,
    );
  }
  lines.push('');
}

if (importRefs.length) {
  lines.push(`## 受影响的 import 引用（${importRefs.length}）`);
  lines.push('');
  lines.push('| 引用方文件 | import 路径 | 指向被改名文件 |');
  lines.push('|---|---|---|');
  for (const r of importRefs) {
    lines.push(`| \`${r.inFile}\` | \`${r.importPath}\` | \`${r.refersTo}\` |`);
  }
  lines.push('');
}

fs.writeFileSync(path.join(OUT, 'rename-plan.md'), lines.join('\n'));

console.log('=== 统计 ===');
console.log(JSON.stringify(stats, null, 2));
console.log('');
console.log(`✅ 输出: ${path.relative(REPO, path.join(OUT, 'rename-plan.json'))}`);
console.log(`✅ 输出: ${path.relative(REPO, path.join(OUT, 'rename-plan.md'))}`);
