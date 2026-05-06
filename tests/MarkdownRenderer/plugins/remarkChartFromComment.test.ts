import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { remarkChartFromComment } from '../../../src/MarkdownRenderer/plugins/remarkChartFromComment';

/**
 * 用 remark-parse 解析 markdown 得到 mdast，然后跑 remarkChartFromComment 转换器，
 * 返回顶层 children，便于断言子节点类型与值。
 */
const runPlugin = (md: string): any => {
  const tree: any = unified().use(remarkParse).parse(md);
  remarkChartFromComment()(tree);
  return tree.children;
};

const TABLE_MD = '| month | value |\n| --- | --- |\n| 2024 | 100 |';

describe('remarkChartFromComment', () => {
  it('converts <!-- {chartConfig} --> + table into a chart code node', () => {
    const md = `<!-- [{"chartType":"line","x":"month","y":"value"}] -->\n${TABLE_MD}`;
    const children = runPlugin(md);

    expect(children).toHaveLength(1);
    expect(children[0].type).toBe('code');
    expect(children[0].lang).toBe('chart');

    const payload = JSON.parse(children[0].value);
    expect(payload.config).toEqual([
      { chartType: 'line', x: 'month', y: 'value' },
    ]);
    expect(payload.columns).toHaveLength(2);
    expect(payload.dataSource).toEqual([
      { key: 'row-1', month: 2024, value: 100 },
    ]);
  });

  it('accepts a single object (auto-wraps to array)', () => {
    const md = `<!-- {"chartType":"bar","x":"a","y":"b"} -->\n| a | b |\n| --- | --- |\n| x | 1 |`;
    const children = runPlugin(md);

    expect(children).toHaveLength(1);
    expect(children[0].type).toBe('code');
    const payload = JSON.parse(children[0].value);
    expect(payload.config).toEqual([{ chartType: 'bar', x: 'a', y: 'b' }]);
  });

  it('skips when all chart configs are explicit "table" type', () => {
    const md = `<!-- [{"chartType":"table"}] -->\n${TABLE_MD}`;
    const children = runPlugin(md);

    // 不应转换：保留原 html 注释 + table 节点
    expect(children.some((c: any) => c.type === 'code' && c.lang === 'chart'))
      .toBe(false);
    expect(children.some((c: any) => c.type === 'table')).toBe(true);
  });

  it('skips when the comment is not a chart-config json', () => {
    const md = `<!-- just a regular comment -->\n${TABLE_MD}`;
    const children = runPlugin(md);
    expect(children.some((c: any) => c.lang === 'chart')).toBe(false);
  });

  it('skips when the json is malformed', () => {
    const md = `<!-- [{not valid json -->\n${TABLE_MD}`;
    const children = runPlugin(md);
    expect(children.some((c: any) => c.lang === 'chart')).toBe(false);
  });

  it('skips when html node is not followed by a table', () => {
    const md = `<!-- [{"chartType":"line"}] -->\n\nplain paragraph`;
    const children = runPlugin(md);
    expect(children.some((c: any) => c.lang === 'chart')).toBe(false);
  });

  it('is a no-op for a tree without children', () => {
    expect(() => remarkChartFromComment()({} as any)).not.toThrow();
    expect(() =>
      remarkChartFromComment()({ children: null } as any),
    ).not.toThrow();
  });
});
