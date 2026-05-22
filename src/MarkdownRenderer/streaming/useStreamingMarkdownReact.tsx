import React, { useMemo, useRef } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import {
  JINJA_DOLLAR_PLACEHOLDER,
  preprocessNormalizeLeafToContainerDirective,
} from '../../MarkdownEditor/editor/parser/constants';
import { debugInfo } from '../../Utils/debugUtils';

import {
  buildEditorAlignedComponents,
  createHastProcessor,
  splitMarkdownBlocks,
  type UseMarkdownToReactOptions,
} from '../markdownReactShared';

import { MarkdownBlockPiece } from './MarkdownBlockPiece';
import { useProgressiveBlocks } from './useProgressiveBlocks';
import { shouldResetRevisionProgress } from './revisionPolicy';
import { useShallowMemo } from './useShallowMemo';

/** 空块数组常量，避免每次返回新引用 */
const EMPTY_BLOCKS: string[] = [];

/**
 * 流式优先的 Markdown → React：每块独立 MarkdownBlockPiece，末块 tail、其余 sealed。
 * 块 key 仅用修订代 + 下标，使「末块晋升为 sealed」时外层组件类型不变，避免子树卸载重挂。
 *
 * 非流式大文档启用分帧渐进渲染：首批只渲染前 N 个块，后续空闲帧逐步追加，
 * 标签页不可见时降级为全量渲染。
 */
export const useStreamingMarkdownReact = (
  content: string,
  options?: UseMarkdownToReactOptions,
): React.ReactNode => {
  const revisionSource =
    options?.contentRevisionSource !== undefined
      ? options.contentRevisionSource
      : content;

  const prevRevisionRef = useRef<string | undefined>(undefined);
  const revisionGenerationRef = useRef(0);

  const processor = useMemo(
    () => createHastProcessor(options?.remarkPlugins, options?.htmlConfig),
    [options?.remarkPlugins, options?.htmlConfig],
  );

  const prefixCls = options?.prefixCls || 'ant-agentic-md-editor';

  const stableComponents = useShallowMemo(options?.components);
  const stableFncProps = useShallowMemo(options?.fncProps);

  const components = useMemo(
    () =>
      buildEditorAlignedComponents(
        prefixCls,
        stableComponents || {},
        options?.streaming,
        options?.linkConfig,
        stableFncProps,
        options?.eleRender,
      ),
    [
      prefixCls,
      stableComponents,
      options?.streaming,
      options?.linkConfig,
      stableFncProps,
      options?.eleRender,
    ],
  );

  // 第一步：拆分 blocks + 更新修订代（纯计算，无副作用）
  const { blocks, generation } = useMemo(() => {
    if (!content) {
      prevRevisionRef.current = '';
      return { blocks: EMPTY_BLOCKS, generation: revisionGenerationRef.current };
    }

    const prevRev = prevRevisionRef.current;
    if (
      prevRev !== undefined &&
      shouldResetRevisionProgress(prevRev, revisionSource)
    ) {
      revisionGenerationRef.current += 1;
    }
    prevRevisionRef.current = revisionSource;

    try {
      const preprocessed = preprocessNormalizeLeafToContainerDirective(
        content.replace(new RegExp(JINJA_DOLLAR_PLACEHOLDER, 'g'), '$'),
      );
      const splitBlocks = splitMarkdownBlocks(preprocessed);
      return {
        blocks: splitBlocks.length > 0 ? splitBlocks : EMPTY_BLOCKS,
        generation: revisionGenerationRef.current,
      };
    } catch (error) {
      debugInfo('[MarkdownRenderer] splitMarkdownBlocks failed', {
        error: (error as Error)?.message || String(error),
      });
      return { blocks: EMPTY_BLOCKS, generation: revisionGenerationRef.current };
    }
  }, [content, revisionSource]);

  // 第二步：分帧渐进——非流式大文档首批只渲染部分块，后续空闲帧追加
  const visibleCount = useProgressiveBlocks(
    blocks.length,
    !!options?.streaming,
    generation,
  );

  // 第三步：生成 React 元素
  return useMemo(() => {
    if (blocks.length === 0) return null;

    const renderCount = Math.min(visibleCount, blocks.length);
    const elements = [];

    for (let index = 0; index < renderCount; index++) {
      const blockSource = blocks[index];
      const isLast = index === blocks.length - 1;
      // key 必须与 variant 解耦——末块由 tail 晋升 sealed 时不能卸载重挂，
      // 否则 chart / agentar-card 等重组件会重复初始化。
      const key = `b-${generation}-${index}`;
      elements.push(
        jsx(
          MarkdownBlockPiece,
          {
            variant: isLast ? 'tail' : 'sealed',
            blockSource,
            processor,
            components,
            streaming: !!options?.streaming,
          },
          key,
        ),
      );
    }

    return jsxs(Fragment, { children: elements });
  }, [blocks, generation, visibleCount, processor, components, options?.streaming]);
};
