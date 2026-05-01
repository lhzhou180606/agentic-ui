import React, { useMemo, useRef } from 'react';
import { AttachmentFileList } from '../AttachmentButton/AttachmentFileList';
import type { AttachmentFile } from '../AttachmentButton/types';
import { MARKDOWN_INPUT_FIELD_TEST_IDS } from '../testIds';
import type { MarkdownInputFieldProps } from '../types/MarkdownInputFieldProps';

interface UseAttachmentListParams {
  attachment?: MarkdownInputFieldProps['attachment'];
  fileMap?: Map<string, AttachmentFile>;
  handleFileRemoval: (file: AttachmentFile) => Promise<void>;
  handleFileRetry: (file: AttachmentFile) => Promise<void>;
  updateAttachmentFiles: (fileMap?: Map<string, AttachmentFile>) => void;
}

/**
 * 附件列表渲染 Hook
 */
export const useAttachmentList = ({
  attachment,
  fileMap,
  handleFileRemoval,
  handleFileRetry,
  updateAttachmentFiles,
}: UseAttachmentListParams): React.ReactNode => {
  return useMemo(() => {
    if (!attachment?.enable) return null;
    return React.createElement(AttachmentFileList, {
      fileMap,
      onDelete: handleFileRemoval,
      onRetry: handleFileRetry,
      onPreview: attachment?.onPreview
        ? (file: AttachmentFile) => {
            void Promise.resolve(attachment.onPreview?.(file)).catch(() => {});
          }
        : undefined,
      onClearFileMap: () => {
        updateAttachmentFiles(undefined);
      },
      dataTestId: MARKDOWN_INPUT_FIELD_TEST_IDS.ATTACHMENT_LIST,
    });
  }, [
    attachment?.enable,
    attachment?.onPreview,
    fileMap,
    handleFileRemoval,
    handleFileRetry,
    updateAttachmentFiles,
  ]);
};

interface UseBeforeToolsParams {
  beforeToolsRender?: MarkdownInputFieldProps['beforeToolsRender'];
  /**
   * 透传给 beforeToolsRender 的组件 props 全集。
   *
   * 注意：beforeToolsRender 的入参类型 `MarkdownInputFieldProps & { isHover, isLoading }`
   * 是公开 API，必须保持。这里通过 ref 持有最新值，使 useMemo 依赖只挂稳定字段，
   * 避免主组件每次渲染产生的新 props 对象触发无效重算。
   */
  props: MarkdownInputFieldProps;
  isHover: boolean;
  isLoading: boolean;
}

/**
 * BeforeTools 渲染 Hook
 *
 * 行为契约：当 `beforeToolsRender` / `isHover` / `isLoading` 变化时重新渲染；
 * `props` 仅作为透传载体（其内部状态变更通常会同时引起 isHover/isLoading
 * 或 beforeToolsRender 引用变化），不参与 useMemo 依赖比较。
 */
export const useBeforeTools = ({
  beforeToolsRender,
  props,
  isHover,
  isLoading,
}: UseBeforeToolsParams): React.ReactNode => {
  // 用 ref 持有最新 props，避免把整个 props 对象挂进 useMemo 依赖
  // （挂进去等价于不缓存，因为主组件每次渲染都会构造新的 props 引用）。
  const propsRef = useRef(props);
  propsRef.current = props;

  return useMemo(() => {
    if (!beforeToolsRender) return null;
    return beforeToolsRender({
      ...propsRef.current,
      isHover,
      isLoading,
    });
  }, [beforeToolsRender, isHover, isLoading]);
};

