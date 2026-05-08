/* eslint-disable no-console */
/**
 * 扫描 tests/ 下所有测试文件，根据其 import 推断对应 src/ 组件目录。
 * 输出迁移映射表：{ from: <abs>, to: <abs>, srcOwner: <relative-src-dir> }[]
 *
 * 推断规则（按优先级）：
 * 1. 文件路径若为 tests/<X>/(...).test.ts(x)，且 src/<X>/ 存在 → 归到 src/<X>/__tests__/...
 * 2. 顶层零散文件 tests/<Name>.test.ts(x)：
 *    - 解析其 import 中第一个形如 ../../src/<Path>/... 的路径
 *    - 取 <Path> 的第一段作为 srcOwner（若是 Components/X、Hooks/X、Utils/X 等也算）
 * 3. 无法推断的写入 unresolved，人工兜底
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const testsRoot = path.join(repoRoot, 'tests');
const srcRoot = path.join(repoRoot, 'src');

/** 递归列出目录下所有文件 */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

/** src/ 下一级真实存在的目录集合 */
const srcTopDirs = new Set(
  fs
    .readdirSync(srcRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name),
);

/** 提取测试文件中第一个 from '...src/...'  路径 */
function findFirstSrcImport(content) {
  const re =
    /from\s+['"]([^'"]*?\/src\/[^'"]+|\.\.[^'"]*\/src\/[^'"]+)['"]/g;
  const matches = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    matches.push(m[1]);
  }
  // 也兼容 `import('...../src/xxx')`
  const re2 = /import\(\s*['"]([^'"]*?\/src\/[^'"]+)['"]\s*\)/g;
  while ((m = re2.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

/** 从 import 路径中抽取 src 之后的第一段（识别 Components/X、Hooks/X、Plugins/X 等多层归属） */
function extractSrcOwnerFromImport(importPath) {
  const idx = importPath.indexOf('/src/');
  if (idx < 0) return null;
  const after = importPath.slice(idx + '/src/'.length);
  const parts = after.split('/');
  if (parts.length === 0) return null;
  const first = parts[0];
  // 形如 src/Components/X、src/Hooks/X、src/Plugins/X、src/Utils/X：取两层
  const twoLayerHosts = new Set([
    'Components',
    'Hooks',
    'Plugins',
    'Utils',
    'Schema',
    'Constants',
    'Types',
    'I18n',
  ]);
  if (twoLayerHosts.has(first) && parts.length >= 2) {
    return `${first}/${parts[1].replace(/\.(tsx?|jsx?|css|less|scss)$/, '')}`;
  }
  return first;
}

/**
 * 把 tests/ 路径转换为 src/<owner>/__tests__/ 下的目标路径。
 *
 * 规则：
 *   - 把 tests/ 下相对路径与 srcOwner 的所有路径段做"前缀对齐去重"
 *   - 例：srcOwner=Schema/SchemaEditor，tests 路径 schema/SchemaEditor/style.test.ts
 *     去重后只保留 style.test.ts
 *   - 例：srcOwner=MarkdownEditor，tests 路径 MarkdownEditor/editor/foo.test.ts
 *     去重后保留 editor/foo.test.ts
 *   - 例：srcOwner=MarkdownEditor，tests 路径 BaseMarkdownEditor.test.tsx（无目录前缀）
 *     直接保留 BaseMarkdownEditor.test.tsx
 */
function buildTargetPath(testFileAbs, srcOwner) {
  const ownerDirAbs = path.join(srcRoot, srcOwner);
  if (!fs.existsSync(ownerDirAbs)) return null;
  const relFromTests = path.relative(testsRoot, testFileAbs);
  const segs = relFromTests.split(path.sep);
  const ownerSegs = srcOwner.split('/');

  // 大小写不敏感的前缀匹配并削去（兼容 tests/schema vs src/Schema）
  let trailing = segs;
  for (const ownerSeg of ownerSegs) {
    if (
      trailing.length > 0 &&
      trailing[0].toLowerCase() === ownerSeg.toLowerCase()
    ) {
      trailing = trailing.slice(1);
    } else {
      break;
    }
  }

  // 例：tests/editor/utils/foo.test.ts，owner=MarkdownEditor → trailing=editor/utils/foo.test.ts
  const targetRel = path.join(srcOwner, '__tests__', ...trailing);
  return path.join(srcRoot, targetRel);
}

/**
 * 人工兜底：unresolved 文件的明确归属
 * key 是 tests/ 下的相对路径（POSIX 分隔符），value 是 src/ 下的 owner 路径
 */
const manualOwnerMap = {
  // Attachment*：MarkdownInputField/AttachmentButton 子模块
  'AttachmentButton.test.tsx': 'MarkdownInputField',
  'AttachmentButtonPopover.test.tsx': 'MarkdownInputField',
  'AttachmentButtonPopover.branches.test.tsx': 'MarkdownInputField',
  'AttachmentFileList.test.tsx': 'MarkdownInputField',
  'AttachmentFileListItem.test.tsx': 'MarkdownInputField',
  // BaseMarkdownEditor.* → MarkdownEditor
  'BaseMarkdownEditor.advanced.test.tsx': 'MarkdownEditor',
  'BaseMarkdownEditor.basic.test.tsx': 'MarkdownEditor',
  'BaseMarkdownEditor.contentStyle.test.tsx': 'MarkdownEditor',
  'BaseMarkdownEditor.lazy.test.tsx': 'MarkdownEditor',
  'BaseMarkdownEditor.ssr.test.tsx': 'MarkdownEditor',
  'BaseMarkdownEditor.test.tsx': 'MarkdownEditor',
  // Bubble 子组件
  'BubbleExtra.shouldShowCopy-onCancelLike.test.tsx': 'Bubble',
  'BubbleExtra.voice.test.tsx': 'Bubble',
  'BubbleList.regression.test.tsx': 'Bubble',
  'BubbleList.test.tsx': 'Bubble',
  'Bubble.test.tsx': 'Bubble',
  // Comment / Filemap / ContributorAvatar 在 MarkdownEditor 下
  'CommentList.test.tsx': 'MarkdownEditor',
  'CommentView.test.tsx': 'MarkdownEditor',
  'ContributorAvatar.test.tsx': 'MarkdownEditor',
  'LazyElement.test.tsx': 'MarkdownEditor',
  'TextStyleTag.test.tsx': 'MarkdownEditor',
  'BoldListItems.test.tsx': 'MarkdownEditor',
  'boldTextIntegration.test.tsx': 'MarkdownEditor',
  'handlePaste.test.tsx': 'MarkdownEditor',
  'handlePaste.branches.test.tsx': 'MarkdownEditor',
  'insertParsedHtmlNodes.test.tsx': 'MarkdownEditor',
  'linkConfig.test.tsx': 'MarkdownEditor',
  'markdownToHtml.safe.test.tsx': 'MarkdownEditor',
  'markdown-html-demo.test.tsx': 'MarkdownEditor',
  'readonly.test.tsx': 'MarkdownEditor',
  'render-failure-regression.test.tsx': 'MarkdownEditor',
  // ContentFilemapView / extractFilemapBlocks → Bubble
  'ContentFilemapView.test.tsx': 'Bubble',
  'extractFilemapBlocks.test.tsx': 'Bubble',
  'extractFilemapBlocks.test.ts': 'Bubble',
  // FileMapView / GroupMenu
  'FileMapView.test.tsx': 'MarkdownInputField',
  'GroupMenu.test.tsx': 'History',
  // i18n / formatTime
  'i18n.test.tsx': 'I18n',
  'formatTime.test.ts': 'Utils',
  // RefinePromptButton / SkillModeBar / SendActions / SendButton → MarkdownInputField
  'RefinePromptButton.test.tsx': 'MarkdownInputField',
  'SkillModeBar.test.tsx': 'MarkdownInputField',
  'SendActions.test.tsx': 'MarkdownInputField',
  'SendButton.test.tsx': 'MarkdownInputField',
  'SendButtonPalette.test.ts': 'MarkdownInputField',
  // Schema 顶层 → 对应 Schema 子目录
  'SchemaEditor.test.tsx': 'Schema/SchemaEditor',
  'SchemaForm.test.tsx': 'Schema/SchemaForm',
  'SchemaRenderer.fallback.test.tsx': 'Schema/SchemaRenderer',
  // VisualList → Components/VisualList
  'VisualList.defaultIcon.test.tsx': 'Components/VisualList',
  // BeforeToolContainer / ChartContainer
  'BeforeToolContainer.test.tsx': 'MarkdownInputField',
  'ChartContainer.test.tsx': 'Plugins/chart',
  // ToolUseBar 顶层
  'ToolUseBar.expandedKeys.test.tsx': 'ToolUseBar',
  'ToolUseBar.test.tsx': 'ToolUseBar',
  'ToolUseBarThink.test.tsx': 'ToolUseBarThink',
  // tests/editor/** → MarkdownEditor
  'editor/Editor.onPaste.test.tsx': 'MarkdownEditor',
  'editor/elements.benchmark.test.tsx': 'MarkdownEditor',
  'editor/elements.performance.test.tsx': 'MarkdownEditor',
  'editor/utils/docxDeserializer.test.tsx': 'MarkdownEditor',
  'editor/utils/isMarkdown.test.tsx': 'MarkdownEditor',
  'editor/utils/schemaToMarkdown.test.tsx': 'MarkdownEditor',
  'editor/utils/textStyle.test.tsx': 'MarkdownEditor',
  // tests/demo/** → MarkdownEditor（测的是 docxDeserializer / parser）
  'demo/parseHtml.test.ts': 'MarkdownEditor',
  'demo/parseMarkdown.test.ts': 'MarkdownEditor',
  'demo/toMarkdown.test.ts': 'MarkdownEditor',
  // tests/plugins/* → Plugins/<name>
  'plugins/chart/components/index.test.ts': 'Plugins/chart',
  'plugins/code/components/AceEditor.theme.test.tsx': 'Plugins/code',
  'plugins/code.test.tsx': 'Plugins/code',
  'plugins/katex.test.tsx': 'Plugins/katex',
  'plugins/mermaid.test.tsx': 'Plugins/mermaid',
};

const allFiles = walk(testsRoot);
const testFiles = allFiles.filter((f) => /\.test\.tsx?$/.test(f));
const supportFiles = allFiles.filter((f) => !/\.test\.tsx?$/.test(f));

const mappings = [];
const unresolved = [];

for (const file of testFiles) {
  const relFromTests = path.relative(testsRoot, file);
  const relPosix = relFromTests.split(path.sep).join('/');
  const segs = relFromTests.split(path.sep);
  const firstSeg = segs[0];

  let srcOwner = null;

  // 规则 0：人工映射兜底（最高优先级）
  if (manualOwnerMap[relPosix]) {
    srcOwner = manualOwnerMap[relPosix];
  }

  // 规则 1：tests/<X>/... 且 src/<X>/ 存在（目录信号 > import 信号，覆盖所有后续推断）
  if (!srcOwner && segs.length > 1) {
    // 大小写不敏感地查找 src/ 下匹配目录（兼容 tests/schema vs src/Schema）
    const matchedTop = [...srcTopDirs].find(
      (d) => d.toLowerCase() === firstSeg.toLowerCase(),
    );
    if (matchedTop) {
      // 处理嵌套的二层 host（如 tests/Components/Loading/、tests/schema/SchemaEditor/）
      const twoLayerHosts = new Set([
        'Components',
        'Hooks',
        'Plugins',
        'Utils',
        'Schema',
        'Constants',
        'Types',
        'I18n',
      ]);
      if (twoLayerHosts.has(matchedTop) && segs.length > 2) {
        const sub = segs[1];
        // 大小写不敏感找 sub
        const subDirs = fs
          .readdirSync(path.join(srcRoot, matchedTop), { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);
        const matchedSub = subDirs.find(
          (d) => d.toLowerCase() === sub.toLowerCase(),
        );
        if (matchedSub) {
          srcOwner = `${matchedTop}/${matchedSub}`;
        } else {
          srcOwner = matchedTop;
        }
      } else {
        srcOwner = matchedTop;
      }
    }
  }

  // 规则 2：根据 import 推断
  if (!srcOwner) {
    const content = fs.readFileSync(file, 'utf8');
    const imports = findFirstSrcImport(content);
    for (const imp of imports) {
      const candidate = extractSrcOwnerFromImport(imp);
      if (!candidate) continue;
      const candAbs = path.join(srcRoot, candidate);
      if (fs.existsSync(candAbs)) {
        srcOwner = candidate;
        break;
      }
      // 一层兜底
      const firstOfCandidate = candidate.split('/')[0];
      if (srcTopDirs.has(firstOfCandidate)) {
        srcOwner = firstOfCandidate;
        break;
      }
    }
  }

  // 规则 3：根据文件名前缀推断（针对 tests/ 顶层零散文件）
  if (!srcOwner && segs.length === 1) {
    const base = segs[0].replace(/\.test\.tsx?$/, '');
    // 取首个大写字母段：BaseMarkdownEditor → 找 src/MarkdownEditor、Bubble、ToolUseBar 等
    const candidates = [
      base,
      base.replace(/^Base/, ''),
      base.split('.')[0],
      base.split('.')[0].replace(/^Base/, ''),
    ];
    for (const c of candidates) {
      if (srcTopDirs.has(c)) {
        srcOwner = c;
        break;
      }
    }
    // 还是没有：尝试匹配前缀（最长前缀优先）
    if (!srcOwner) {
      const sorted = [...srcTopDirs].sort((a, b) => b.length - a.length);
      for (const dir of sorted) {
        if (base.startsWith(dir)) {
          srcOwner = dir;
          break;
        }
      }
    }
  }

  if (!srcOwner) {
    unresolved.push({ from: file, reason: 'no-owner' });
    continue;
  }

  const target = buildTargetPath(file, srcOwner);
  if (!target) {
    unresolved.push({ from: file, srcOwner, reason: 'owner-not-exist' });
    continue;
  }

  mappings.push({
    from: path.relative(repoRoot, file),
    to: path.relative(repoRoot, target),
    srcOwner,
  });
}

const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'mappings.json'),
  JSON.stringify(mappings, null, 2),
);
fs.writeFileSync(
  path.join(outDir, 'unresolved.json'),
  JSON.stringify(unresolved, null, 2),
);
fs.writeFileSync(
  path.join(outDir, 'support-files.json'),
  JSON.stringify(
    supportFiles.map((f) => path.relative(repoRoot, f)),
    null,
    2,
  ),
);

// 统计 srcOwner 分布
const ownerCount = {};
for (const m of mappings) {
  ownerCount[m.srcOwner] = (ownerCount[m.srcOwner] || 0) + 1;
}
const ownerStat = Object.entries(ownerCount).sort((a, b) => b[1] - a[1]);
console.log('=== Mapping Stats ===');
console.log('Total test files:', testFiles.length);
console.log('Resolved:', mappings.length);
console.log('Unresolved:', unresolved.length);
console.log('Support files:', supportFiles.length);
console.log('--- Owner distribution ---');
for (const [owner, count] of ownerStat) {
  console.log(`  ${owner}: ${count}`);
}
console.log('--- Unresolved (top 20) ---');
for (const u of unresolved.slice(0, 20)) {
  console.log('  ', u);
}
console.log('Output: scripts/migrate-tests/out/{mappings,unresolved,support-files}.json');
