import {
  BaseSelection,
  Editor,
  Element,
  Node,
  Path,
  Range,
  Text,
  Transforms,
} from 'slate';
import { Elements, MarkdownEditorProps } from '../../BaseMarkdownEditor';
import type { MarkdownEditorPlugin } from '../../plugin';
import type { EditorStore } from '../store';
import { isMarkdown } from '../utils';
import { getMediaType } from '../utils/dom';
import { EditorUtils } from '../utils/editorUtils';
import { isHtml } from '../utils/htmlToMarkdown';
import { toUnixPath } from '../utils/path';
import { insertParsedHtmlNodes } from './insertParsedHtmlNodes';
import { parseMarkdownToNodesAndInsert } from './parseMarkdownToNodesAndInsert';

const isValidSlateNode = (node: unknown): node is Node => {
  if (Element.isElement(node)) return true;
  if (Text.isText(node)) return true;
  return false;
};

/** 媒体文件扩展名映射 */
const MEDIA_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'],
  video: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv'],
  audio: ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'],
} as const;

/** 媒体相关路径关键词映射 */
const MEDIA_PATHS = {
  image: ['/image', '/img', '/photo', '/picture', '/avatar', '/icon'],
  video: ['/video', '/media', '/movie', '/clip'],
  audio: ['/audio', '/music', '/sound', '/voice'],
} as const;

type MediaType = keyof typeof MEDIA_EXTENSIONS;

/** 验证 URL 是否为有效的媒体资源链接 */
const isValidMediaUrl = (url: string, type: string): boolean => {
  if (!url) return false;

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return true;
  }

  const extensions = MEDIA_EXTENSIONS[type as MediaType] ?? [];
  const lowerUrl = url.toLowerCase();
  const hasValidExtension = extensions.some((ext) => lowerUrl.includes(ext));

  const paths = MEDIA_PATHS[type as MediaType] ?? [];
  const hasMediaPath = paths.some((mediaPath) => lowerUrl.includes(mediaPath));

  return hasValidExtension || hasMediaPath;
};

/** 需要直接插入文本的节点类型 */
const DIRECT_INSERT_NODE_TYPES = [
  'table-cell',
  'table-row',
  'table',
  'code',
  'schema',
  'apaasify',
  'agentic-ui-task',
  'agentic-ui-toolusebar',
  'agentic-ui-usertoolbar',
  'agentic-ui-filemap',
] as const;

/**
 * 处理粘贴的 Slate Markdown 片段
 */
export const handleSlateMarkdownFragment = (
  editor: Editor,
  clipboardData: DataTransfer,
  currentTextSelection: BaseSelection,
) => {
  try {
    const encoded = clipboardData.getData('application/x-slate-md-fragment');
    const raw = JSON.parse(encoded || '[]');
    const parsed = (Array.isArray(raw) ? raw : []).filter(isValidSlateNode);
    const fragment = parsed.map((node: Node) => {
      if (Element.isElement(node) && node.type === 'card') {
        return {
          ...node,
          children: [
            {
              type: 'card-before',
              children: [{ text: '' }],
            },
            ...node.children,
            {
              type: 'card-after',
              children: [{ text: '' }],
            },
          ],
        };
      }
      return node;
    });

    if (
      fragment.length === 1 &&
      fragment?.at(0).type === 'paragraph' &&
      currentTextSelection
    ) {
      const text = Node.string(fragment.at(0));
      if (text) {
        Transforms.insertText(editor, text, {
          at: currentTextSelection.focus,
        });
        return true;
      }
      return true;
    }

    if (fragment.length === 0) return true;
    EditorUtils.replaceSelectedNode(editor, fragment);
    return true;
  } catch (error) {
    console.error('[handlePaste] 处理 Slate fragment 粘贴失败:', error);
    return false;
  }
};

/**
 * 处理粘贴的 HTML 内容
 */
export const handleHtmlPaste = async (
  editor: Editor,
  clipboardData: DataTransfer,
  editorProps: MarkdownEditorProps,
) => {
  try {
    // getData 是同步方法，返回 string，不需要 await
    const html = clipboardData.getData('text/html');
    const rtf = clipboardData.getData('text/rtf');

    if (html) {
      return await insertParsedHtmlNodes(editor, html, editorProps, rtf);
    }
    return false;
  } catch (error) {
    console.error('[handlePaste] 处理 HTML 粘贴失败:', error);
    return false;
  }
};

/**
 * 处理粘贴的文件
 */
export const handleFilesPaste = async (
  editor: Editor,
  clipboardData: DataTransfer,
  editorProps: MarkdownEditorProps,
) => {
  try {
    const fileList = clipboardData.files;
    if (fileList.length === 0 || !editorProps.image?.upload) {
      return false;
    }

    const uploadResults = await Promise.all(
      Array.from(fileList).map((file) => editorProps.image!.upload!([file])),
    );
    const uploadedUrls = uploadResults.flat(1);

    const focusPath = editor?.selection?.focus?.path;
    const parentNode = focusPath
      ? Node.get(editor, Path.parent(focusPath)!)
      : null;

    const insertAt = focusPath
      ? EditorUtils.findNext(editor, focusPath)!
      : undefined;

    uploadedUrls.forEach((uploadedUrl) => {
      if (!uploadedUrl) return;
      Transforms.insertNodes(
        editor,
        EditorUtils.createMediaNode(uploadedUrl, 'image'),
        {
          at: [
            ...(parentNode && parentNode.type === 'table-cell'
              ? focusPath!
              : insertAt
                ? insertAt
                : [editor.children.length - 1]),
          ],
        },
      );
    });
    return true;
  } catch (error) {
    console.error('[handlePaste] 文件粘贴上传失败:', error);
    return false;
  }
};

/**
 * 处理特殊文本格式（media:// 和 attach:// 链接）
 */
export const handleSpecialTextPaste = (
  editor: Editor,
  text: string,
  selection: BaseSelection,
) => {
  if (text.startsWith('media://') || text.startsWith('attach://')) {
    const path = EditorUtils.findMediaInsertPath(editor);
    const urlObject = new URL(text);
    let url = urlObject.searchParams.get('url');
    if (url && !url.startsWith('http') && !url.startsWith('blob:http')) {
      url = toUnixPath(url);
    }
    if (path && url) {
      if (text.startsWith('media://')) {
        Editor.withoutNormalizing(editor, () => {
          Transforms.insertNodes(
            editor,
            EditorUtils.createMediaNode(url!, 'image'),
            { select: true, at: path },
          );
          const next = Editor.next(editor, { at: path });
          if (next && next[0].type === 'paragraph' && !Node.string(next[0])) {
            Transforms.delete(editor, { at: selection! });
          }
        });
        return true;
      }
      if (text.startsWith('attach://')) {
        Editor.withoutNormalizing(editor, () => {
          Transforms.insertNodes(
            editor,
            {
              type: 'attach',
              name: urlObject.searchParams.get('name'),
              size: Number(urlObject.searchParams.get('size') || 0),
              url: url || undefined,
              children: [{ text: '' }],
            },
            { select: true, at: path },
          );
          const next = Editor.next(editor, { at: path });
          if (next && next[0].type === 'paragraph' && !Node.string(next[0])) {
            Transforms.delete(editor, { at: selection! });
          }
        });
        return true;
      }
    }
  }
  return false;
};

/**
 * 处理 HTTP 链接
 */
export const handleHttpLinkPaste = (
  editor: Editor,
  text: string,
  selection: BaseSelection,
  store: Pick<EditorStore, 'insertLink'>,
) => {
  if (!text.startsWith('http')) return false;

  const mediaType = getMediaType(text);

  if (['image', 'video', 'audio'].includes(mediaType)) {
    if (isValidMediaUrl(text, mediaType)) {
      const path = EditorUtils.findMediaInsertPath(editor);
      if (!path) return false;
      Transforms.insertNodes(
        editor,
        EditorUtils.createMediaNode(text, 'image'),
        {
          select: true,
          at: selection ?? undefined,
        },
      );
      return true;
    }
  }

  store.insertLink(text);
  return true;
};

/**
 * 处理普通文本粘贴
 */
export const handlePlainTextPaste = async (
  editor: Editor,
  text: string,
  selection: BaseSelection,
  plugins: MarkdownEditorPlugin[],
  allowedTypes?: string[],
) => {
  if (isMarkdown(text)) {
    await parseMarkdownToNodesAndInsert(editor, text, plugins);
    return true;
  }
  // 仅当 allowedTypes 允许 text/html 时才走 HTML 解析，
  // 避免绕过调用方对 pasteConfig.allowedTypes 的限制
  const htmlAllowed = !allowedTypes || allowedTypes.includes('text/html');
  if (htmlAllowed && isHtml(text)) {
    const success = await insertParsedHtmlNodes(editor, text, plugins, '');
    if (success) return true;
  }

  if (selection) {
    Transforms.insertText(editor, text, { at: selection });
  } else {
    Transforms.insertNodes(editor, [
      {
        type: 'paragraph',
        children: [{ text }],
      },
    ]);
  }
  return true;
};

/**
 * 检查是否需要直接插入文本（在特定节点类型中）
 */
export const shouldInsertTextDirectly = (
  editor: Editor,
  selection: BaseSelection,
) => {
  if (!selection?.focus) return false;

  const rangeNodes = Editor?.node(editor, [selection.focus.path.at(0)!]);
  if (!rangeNodes) return false;

  const rangeNode = rangeNodes.at(0) as Elements;
  return (DIRECT_INSERT_NODE_TYPES as readonly string[]).includes(
    rangeNode.type,
  );
};

/**
 * 处理标签节点的粘贴
 */
export const handleTagNodePaste = (
  editor: Editor,
  currentTextSelection: Range,
  clipboardData: DataTransfer,
  curNode: Node & { tag?: boolean | null },
) => {
  if (curNode?.tag) {
    const text = clipboardData.getData('text/plain');
    if (text) {
      Transforms.insertText(editor, text, {
        at: currentTextSelection.focus,
      });
      return true;
    }
  }
  return false;
};
