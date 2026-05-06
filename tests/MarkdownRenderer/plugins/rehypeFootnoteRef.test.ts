import rehypeParse from 'rehype-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { rehypeFootnoteRef } from '../../../src/MarkdownRenderer/plugins/rehypeFootnoteRef';

/**
 * 用 rehype-parse（fragment 模式）将 HTML 字符串解析为 hast，跑插件后返回 hast 树。
 */
const runOnHtml = (html: string): any => {
  const tree: any = unified().use(rehypeParse, { fragment: true }).parse(html);
  rehypeFootnoteRef()(tree);
  return tree;
};

/** 在 hast 中收集所有 fnc span 节点 */
const collectFncSpans = (tree: any): any[] => {
  const out: any[] = [];
  const walk = (node: any) => {
    if (
      node?.type === 'element' &&
      node.tagName === 'span' &&
      node.properties?.['data-fnc'] === 'fnc'
    ) {
      out.push(node);
    }
    if (Array.isArray(node?.children)) node.children.forEach(walk);
  };
  walk(tree);
  return out;
};

describe('rehypeFootnoteRef', () => {
  it('converts a single bare [^name] into a fnc span', () => {
    const tree = runOnHtml('<p>see [^1] here</p>');
    const spans = collectFncSpans(tree);
    expect(spans).toHaveLength(1);
    expect(spans[0].properties['data-fnc-name']).toBe('1');
    expect(spans[0].children[0]).toMatchObject({ type: 'text', value: '1' });
  });

  it('converts multiple references in one text node', () => {
    const tree = runOnHtml('<p>a [^x] then [^y] end</p>');
    const spans = collectFncSpans(tree);
    expect(spans.map((s) => s.properties['data-fnc-name'])).toEqual([
      'x',
      'y',
    ]);
  });

  it('preserves leading and trailing text fragments around references', () => {
    const tree = runOnHtml('<p>head [^1] tail</p>');
    // 找到 <p> 节点，断言其拆分后的子节点序列
    const p = tree.children.find(
      (c: any) => c.type === 'element' && c.tagName === 'p',
    );
    const texts = p.children.filter((c: any) => c.type === 'text');
    const joined = texts.map((t: any) => t.value).join('|');
    expect(joined.startsWith('head ')).toBe(true);
    expect(joined).toContain(' tail');
  });

  it('does not modify text without footnote refs', () => {
    const tree = runOnHtml('<p>hello world</p>');
    expect(collectFncSpans(tree)).toHaveLength(0);
  });

  it('handles supported identifier characters', () => {
    const tree = runOnHtml('<p>[^abc-123_x]</p>');
    const spans = collectFncSpans(tree);
    expect(spans).toHaveLength(1);
    expect(spans[0].properties['data-fnc-name']).toBe('abc-123_x');
  });
});
