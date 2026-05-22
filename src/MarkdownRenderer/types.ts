import type React from 'react';
import type {
  MarkdownRemarkPlugin,
  MarkdownToHtmlConfig,
} from '../MarkdownEditor/editor/utils/markdownToHtml';
import type { MarkdownEditorPlugin } from '../MarkdownEditor/plugin';
import type { MarkdownEditorProps } from '../MarkdownEditor/types';
import type { AttachmentFile } from '../MarkdownInputField/AttachmentButton/types';
import type { FileMapViewProps } from '../MarkdownInputField/FileMapView';

/** 透传给 agentic-ui-filemap 代码块渲染器的配置 */
export interface FileMapConfig {
  /** 传入则阻止内置预览（灯箱/弹窗/window.open） */
  onPreview?: (file: AttachmentFile) => void;
  /** 自定义媒体条目渲染 */
  itemRender?: FileMapViewProps['itemRender'];
  /** 将原始 JSON 条目转为 AttachmentFile，返回 null 过滤该条目 */
  normalizeFile?: (
    raw: Record<string, unknown>,
    defaultFile: AttachmentFile,
  ) => AttachmentFile | null;
}

export interface MarkdownRendererEleProps {
  tagName: string;
  node?: any;
  children?: React.ReactNode;
  [key: string]: any;
}

export type { RendererPlugin } from '../MarkdownEditor/plugin';

export interface RendererBlockProps {
  node?: any;
  children?: React.ReactNode;
  [key: string]: any;
}

export type RenderMode = 'slate' | 'markdown';

export interface MarkdownRendererProps {
  content: string;
  streaming?: boolean;
  plugins?: MarkdownEditorPlugin[];
  remarkPlugins?: MarkdownRemarkPlugin[];
  htmlConfig?: MarkdownToHtmlConfig;
  className?: string;
  style?: React.CSSProperties;
  prefixCls?: string;
  codeProps?: MarkdownEditorProps['codeProps'];
  fncProps?: MarkdownEditorProps['fncProps'];
  linkConfig?: {
    /** 默认 true */
    openInNewTab?: boolean;
    /** 返回 false 阻止跳转 */
    onClick?: (url?: string) => boolean | void;
  };
  apaasify?: {
    enable?: boolean;
    render?: (value: any) => React.ReactNode;
  };
  fileMapConfig?: FileMapConfig;
  /** 返回 undefined 回退默认渲染 */
  eleRender?: (
    props: MarkdownRendererEleProps,
    defaultDom: React.ReactNode,
  ) => React.ReactNode;
}

export interface MarkdownRendererRef {
  nativeElement: HTMLDivElement | null;
  getDisplayedContent: () => string;
}
