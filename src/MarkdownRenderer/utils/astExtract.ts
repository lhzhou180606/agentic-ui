import React from 'react';

/**
 * AST 提取工具集——从 mdast / hast / React children 中抽取文本与结构化数据。
 *
 * 这些工具原本散落在 `markdownReactShared.ts` 的开头，按职责单独拆出便于复用与测试。
 */

/**
 * 从 mdast 表格单元格节点中提取纯文本。
 * 递归收集所有 `text` 子节点的 value，去除前后空白。
 */
export const extractCellText = (cell: any): string => {
  if (!cell?.children) return '';
  return cell.children
    .map((child: any) => {
      if (child.type === 'text') return child.value || '';
      if (child.children) return extractCellText(child);
      return '';
    })
    .join('')
    .trim();
};

/**
 * 从 mdast `table` 节点提取列定义和数据行。
 *
 * - 第一行视为表头，其余行作为数据
 * - 数据值优先尝试转为数字（含中文金额识别），失败则保留原字符串
 *
 * @returns 解析失败（缺表头 / 空表）时返回 `null`
 */
export const extractTableData = (
  tableNode: any,
  parseChineseCurrencyToNumber: (val: string) => number | null,
): {
  columns: { title: string; dataIndex: string }[];
  dataSource: Record<string, any>[];
} | null => {
  if (!tableNode.children?.length) return null;

  const headerRow = tableNode.children[0];
  if (!headerRow?.children?.length) return null;

  const columns = headerRow.children.map((cell: any) => {
    const text = extractCellText(cell);
    return { title: text, dataIndex: text, key: text };
  });

  const dataSource: Record<string, any>[] = [];
  for (let i = 1; i < tableNode.children.length; i++) {
    const row = tableNode.children[i];
    if (!row?.children) continue;
    const record: Record<string, any> = { key: `row-${i}` };
    row.children.forEach((cell: any, j: number) => {
      if (j < columns.length) {
        const val = extractCellText(cell);
        if (val === '') {
          record[columns[j].dataIndex] = val;
        } else {
          const num = Number(val);
          if (Number.isFinite(num)) {
            record[columns[j].dataIndex] = num;
          } else {
            const cn = parseChineseCurrencyToNumber(val);
            record[columns[j].dataIndex] = cn !== null ? cn : val;
          }
        }
      }
    });
    dataSource.push(record);
  }

  return { columns, dataSource };
};

/**
 * 从 className 字符串/数组中提取 `language-xxx` 形式的语言标识。
 *
 * 与 `pre > code` 的代码块语言识别配套使用。
 */
export const extractLanguageFromClassName = (
  className: string | string[] | undefined,
): string | undefined => {
  if (!className) return undefined;
  const flat =
    typeof className === 'string' ? className : className.map(String).join(' ');
  const classes = flat.split(/\s+/).filter(Boolean);
  for (const cls of classes) {
    const match = cls.match(/^language-(.+)$/);
    if (match) return match[1];
  }
  return undefined;
};

/**
 * 递归提取 React children 中的纯文本。
 *
 * 用于在 hast → React 转换后，从已渲染的子树重新拿到原始文本（如 `<think>` 内容）。
 */
export const extractChildrenText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children))
    return children.map(extractChildrenText).join('');
  if (React.isValidElement(children) && (children as any).props?.children) {
    return extractChildrenText((children as any).props.children);
  }
  return '';
};
