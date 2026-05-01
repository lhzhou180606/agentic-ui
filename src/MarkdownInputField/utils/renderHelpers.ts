import React, { useMemo } from 'react';
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
  props: MarkdownInputFieldProps;
  isHover: boolean;
  isLoading: boolean;
}

/**
 * BeforeTools 渲染 Hook
 */
export const useBeforeTools = ({
  beforeToolsRender,
  props,
  isHover,
  isLoading,
}: UseBeforeToolsParams): React.ReactNode => {
  return useMemo(() => {
    if (beforeToolsRender) {
      return beforeToolsRender({
        ...props,
        isHover,
        isLoading,
      });
    }
    return null;
  }, [beforeToolsRender, props, isHover, isLoading]);
};

