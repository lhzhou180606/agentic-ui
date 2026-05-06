import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  extractCellText,
  extractChildrenText,
  extractLanguageFromClassName,
  extractTableData,
} from '../../../src/MarkdownRenderer/utils/astExtract';

/** 简易的中文金额转数字 stub：仅用于覆盖 extractTableData 的回退分支 */
const stubChineseCurrency = (val: string): number | null => {
  if (val === '一千') return 1000;
  return null;
};

describe('astExtract / extractCellText', () => {
  it('returns empty string when cell has no children', () => {
    expect(extractCellText(null)).toBe('');
    expect(extractCellText({})).toBe('');
    expect(extractCellText({ children: undefined })).toBe('');
  });

  it('joins text node values', () => {
    const cell = {
      children: [
        { type: 'text', value: 'hello' },
        { type: 'text', value: ' world' },
      ],
    };
    expect(extractCellText(cell)).toBe('hello world');
  });

  it('recurses into nested children', () => {
    const cell = {
      children: [
        { type: 'emphasis', children: [{ type: 'text', value: 'inner' }] },
        { type: 'text', value: ' outer' },
      ],
    };
    expect(extractCellText(cell)).toBe('inner outer');
  });

  it('trims surrounding whitespace', () => {
    const cell = {
      children: [{ type: 'text', value: '  padded  ' }],
    };
    expect(extractCellText(cell)).toBe('padded');
  });

  it('skips unknown node types without value', () => {
    const cell = {
      children: [{ type: 'unknown' }, { type: 'text', value: 'kept' }],
    };
    expect(extractCellText(cell)).toBe('kept');
  });
});

describe('astExtract / extractTableData', () => {
  it('returns null when table has no header row', () => {
    expect(extractTableData({ children: [] }, stubChineseCurrency)).toBeNull();
    expect(
      extractTableData({ children: [{ children: [] }] }, stubChineseCurrency),
    ).toBeNull();
  });

  it('extracts columns and dataSource with numeric coercion', () => {
    const tableNode = {
      children: [
        {
          children: [
            { children: [{ type: 'text', value: 'name' }] },
            { children: [{ type: 'text', value: 'value' }] },
          ],
        },
        {
          children: [
            { children: [{ type: 'text', value: 'a' }] },
            { children: [{ type: 'text', value: '10' }] },
          ],
        },
      ],
    };
    const result = extractTableData(tableNode, stubChineseCurrency);
    expect(result).not.toBeNull();
    expect(result!.columns).toEqual([
      { title: 'name', dataIndex: 'name', key: 'name' },
      { title: 'value', dataIndex: 'value', key: 'value' },
    ]);
    expect(result!.dataSource).toHaveLength(1);
    expect(result!.dataSource[0]).toMatchObject({
      key: 'row-1',
      name: 'a',
      value: 10,
    });
  });

  it('falls back to chinese currency parser when number coercion fails', () => {
    const tableNode = {
      children: [
        {
          children: [{ children: [{ type: 'text', value: 'amount' }] }],
        },
        {
          children: [{ children: [{ type: 'text', value: '一千' }] }],
        },
        {
          children: [{ children: [{ type: 'text', value: 'xx' }] }],
        },
      ],
    };
    const result = extractTableData(tableNode, stubChineseCurrency);
    expect(result!.dataSource[0].amount).toBe(1000);
    // currency parser 返回 null 时保留原字符串
    expect(result!.dataSource[1].amount).toBe('xx');
  });

  it('keeps empty string for empty cell value', () => {
    const tableNode = {
      children: [
        {
          children: [{ children: [{ type: 'text', value: 'col' }] }],
        },
        {
          children: [{ children: [] }],
        },
      ],
    };
    const result = extractTableData(tableNode, stubChineseCurrency);
    expect(result!.dataSource[0].col).toBe('');
  });

  it('skips rows without children', () => {
    const tableNode = {
      children: [
        {
          children: [{ children: [{ type: 'text', value: 'col' }] }],
        },
        null,
        { children: undefined },
      ],
    };
    const result = extractTableData(tableNode, stubChineseCurrency);
    expect(result!.dataSource).toHaveLength(0);
  });
});

describe('astExtract / extractLanguageFromClassName', () => {
  it('returns undefined for missing className', () => {
    expect(extractLanguageFromClassName(undefined)).toBeUndefined();
  });

  it('extracts language from `language-xxx`', () => {
    expect(extractLanguageFromClassName('language-typescript')).toBe(
      'typescript',
    );
  });

  it('handles className arrays', () => {
    expect(
      extractLanguageFromClassName(['hljs', 'language-json']),
    ).toBe('json');
  });

  it('returns undefined when no language- class is present', () => {
    expect(extractLanguageFromClassName('hljs other')).toBeUndefined();
  });
});

describe('astExtract / extractChildrenText', () => {
  it('returns string children directly', () => {
    expect(extractChildrenText('hello')).toBe('hello');
  });

  it('stringifies number children', () => {
    expect(extractChildrenText(42)).toBe('42');
  });

  it('joins array of mixed children', () => {
    expect(extractChildrenText(['a', 1, 'b'])).toBe('a1b');
  });

  it('recurses into React element props.children', () => {
    const el = React.createElement('span', null, 'inner');
    expect(extractChildrenText(el)).toBe('inner');
  });

  it('returns empty string for null/undefined/booleans', () => {
    expect(extractChildrenText(null)).toBe('');
    expect(extractChildrenText(undefined)).toBe('');
    expect(extractChildrenText(true as unknown as React.ReactNode)).toBe('');
  });
});
