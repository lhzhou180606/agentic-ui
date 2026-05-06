import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import type { Plugin, Processor } from 'unified';
import { unified } from 'unified';

import { remarkDirectiveContainer } from '../MarkdownEditor/editor/parser/remarkDirectiveContainer';
import remarkDirectiveContainersOnly from '../MarkdownEditor/editor/parser/remarkDirectiveContainersOnly';
import {
  convertParagraphToImage,
  fixStrongWithSpecialChars,
  protectJinjaDollarInText,
} from '../MarkdownEditor/editor/parser/remarkParse';
import {
  REMARK_REHYPE_DIRECTIVE_HANDLERS,
  type MarkdownRemarkPlugin,
  type MarkdownToHtmlConfig,
} from '../MarkdownEditor/editor/utils/markdownToHtml';
import { rehypeSanitizeUserHtml } from '../Utils/rehypeSanitizeUserHtml';
import { rehypeFootnoteRef } from './plugins/rehypeFootnoteRef';
import { remarkChartFromComment } from './plugins/remarkChartFromComment';

/** `remark-math` 启用 `$...$` 单美元符号包裹的行内数学 */
const INLINE_MATH_WITH_SINGLE_DOLLAR = { singleDollarTextMath: true };

/** `remark-frontmatter` 仅识别 yaml 风格 frontmatter */
const FRONTMATTER_LANGUAGES: readonly string[] = ['yaml'];

/** `remark-directive-container` 默认渲染配置 */
const REMARK_DIRECTIVE_CONTAINER_OPTIONS = {
  className: 'markdown-container',
  titleElement: { className: ['markdown-container__title'] },
};

const remarkRehypePlugin = remarkRehype as unknown as Plugin;

/**
 * 构建 markdown → mdast → hast 的 unified 处理器。
 *
 * 内置插件链（顺序敏感）：
 * 1. `remarkParse` - markdown 字符串 → mdast
 * 2. `remarkGfm` - GFM 扩展（表格、删除线、任务列表、脚注）
 * 3. `fixStrongWithSpecialChars` - 修复 `**xxx**` 内含特殊字符的解析
 * 4. `convertParagraphToImage` - 段落仅含图片时升级为图片块
 * 5. `protectJinjaDollarInText` - 保护 Jinja 模板中的 `$` 不被 math 误识别
 * 6. `remarkMath` - 行内/块级数学公式识别
 * 7. `remarkFrontmatter` - yaml frontmatter 识别
 * 8. `remarkDirectiveContainersOnly` + `remarkDirectiveContainer` - `:::` 容器指令
 * 9. `remarkChartFromComment` - HTML 注释 + 表格 → chart 代码块
 * 10. `remarkRehype` - mdast → hast（保留原始 HTML）
 * 11. `rehypeRaw` - 处理 hast 中的原始 HTML 字符串
 * 12. `rehypeSanitizeUserHtml` - 安全过滤用户 HTML
 * 13. `rehypeKatex` - 数学公式 → KaTeX
 * 14. `rehypeFootnoteRef` - 裸 `[^N]` → fnc span（无底部定义场景）
 *
 * 之后追加用户自定义的 `extraRemarkPlugins` 与 `config.markedConfig`。
 */
export const createHastProcessor = (
  extraRemarkPlugins?: MarkdownRemarkPlugin[],
  config?: MarkdownToHtmlConfig,
): Processor => {
  const processor = unified() as Processor & {
    use: (plugin: Plugin, ...args: unknown[]) => Processor;
  };

  (processor as any)
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(fixStrongWithSpecialChars)
    .use(convertParagraphToImage)
    .use(protectJinjaDollarInText)
    .use(remarkMath, INLINE_MATH_WITH_SINGLE_DOLLAR)
    .use(remarkFrontmatter, FRONTMATTER_LANGUAGES)
    .use(remarkDirectiveContainersOnly)
    .use(remarkDirectiveContainer, REMARK_DIRECTIVE_CONTAINER_OPTIONS)
    .use(remarkChartFromComment)
    .use(remarkRehypePlugin, {
      allowDangerousHtml: true,
      handlers: REMARK_REHYPE_DIRECTIVE_HANDLERS,
    })
    .use(rehypeRaw)
    .use(rehypeSanitizeUserHtml)
    .use(rehypeKatex, { strict: 'ignore' } as any)
    .use(rehypeFootnoteRef);

  if (extraRemarkPlugins) {
    extraRemarkPlugins.forEach((entry) => {
      if (Array.isArray(entry)) {
        const [plugin, ...pluginOptions] = entry as unknown as [
          Plugin,
          ...unknown[],
        ];
        processor.use(plugin, ...pluginOptions);
      } else {
        processor.use(entry as Plugin);
      }
    });
  }

  if (config?.markedConfig) {
    config.markedConfig.forEach((entry) => {
      if (Array.isArray(entry)) {
        const [plugin, ...pluginOptions] = entry as unknown as [
          Plugin,
          ...unknown[],
        ];
        processor.use(plugin, ...pluginOptions);
      } else {
        processor.use(entry as Plugin);
      }
    });
  }

  return processor as Processor;
};
