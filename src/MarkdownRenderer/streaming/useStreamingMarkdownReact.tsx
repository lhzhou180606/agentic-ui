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
import { ProgressiveFadeIn } from './ProgressiveFadeIn';
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
        options?.streamingParagraphAnimation,
        options?.eleRender,
      ),
    [
      prefixCls,
      stableComponents,
      options?.streaming,
      options?.linkConfig,
      stableFncProps,
      options?.streamingParagraphAnimation,
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
  );

  // 追踪已渲染过的块下标上限，用于判断哪些块是"本轮新增"需要淡入动画
  const committedCountRef = useRef(0);
  // generation 变化时重置
  const prevGenRef = useRef(generation);
  if (prevGenRef.current !== generation) {
    prevGenRef.current = generation;
    committedCountRef.current = 0;
  }

  // 第三步：生成 React 元素
  const result = useMemo(() => {
    if (blocks.length === 0) return null;

    const renderCount = Math.min(visibleCount, blocks.length);
    const isProgressive = !options?.streaming && blocks.length > renderCount;
    const fadeStart = committedCountRef.current;
    const elements = [];

    for (let index = 0; index < renderCount; index++) {
      const blockSource = blocks[index];
      const isLast = index === blocks.length - 1;
      // key 必须与 variant 解耦——末块由 tail 晋升 sealed 时不能卸载重挂，
      // 否则 chart / agentar-card 等重组件会重复初始化。
      const key = `b-${generation}-${index}`;
      const piece = jsx(
        MarkdownBlockPiece,
        {
          variant: isLast ? 'tail' : 'sealed',
          blockSource,
          processor,
          components,
          streaming: !!options?.streaming,
        },
        key,
      );

      // 分帧渐进中新增的块：套模糊淡入动画，避免突然出现导致闪动
      if (isProgressive && index >= fadeStart && fadeStart > 0) {
        elements.push(
          jsx(ProgressiveFadeIn, { children: piece }, `fade-${key}`),
        );
      } else {
        elements.push(piece);
      }
    }

    return jsxs(Fragment, { children: elements });
  }, [blocks, generation, visibleCount, processor, components, options?.streaming]);

  // 更新已提交计数，放在 useMemo 之后确保与渲染同步
  committedCountRef.current = Math.min(visibleCount, blocks.length);

  return result;
};
