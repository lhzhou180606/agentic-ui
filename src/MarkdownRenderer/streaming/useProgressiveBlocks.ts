import { useEffect, useRef, useState } from 'react';

/**
 * 非流式大文档分帧渐进渲染：首批只渲染前 N 个块，后续在空闲帧逐步追加。
 *
 * - 流式场景（streaming=true）不启用，直接返回全量
 * - 块数 ≤ 阈值时不启用，直接返回全量
 * - 标签页不可见时降级为一次性全量渲染（RAF/rIC 被冻结会导致内容缺失）
 * - 切回可见时如果尚未渲染完，继续分帧追加
 */

/** 首批渲染块数 */
const INITIAL_BATCH = 8;
/** 每帧追加块数 */
const BATCH_SIZE = 6;
/** 块数低于此值不启用分帧 */
const PROGRESSIVE_THRESHOLD = 12;

/**
 * @param totalBlocks 总块数
 * @param streaming 是否处于流式模式
 * @param generation 内容生成代 —— 当文档被整体替换为等长内容时用于检测
 * @returns visibleCount —— 当前应渲染的块数（≤ totalBlocks）
 */
export function useProgressiveBlocks(
  totalBlocks: number,
  streaming: boolean,
  generation?: number,
): number {
  const [visibleCount, setVisibleCount] = useState(() => {
    if (streaming || totalBlocks <= PROGRESSIVE_THRESHOLD) {
      return totalBlocks;
    }
    return Math.min(INITIAL_BATCH, totalBlocks);
  });

  const prevTotalRef = useRef(totalBlocks);
  const prevStreamingRef = useRef(streaming);
  const prevGenerationRef = useRef(generation);

  // 当 totalBlocks、streaming 或 generation 变化时，重新决定初始值
  useEffect(() => {
    const totalChanged = totalBlocks !== prevTotalRef.current;
    const streamingChanged = streaming !== prevStreamingRef.current;
    const generationChanged = generation !== prevGenerationRef.current;
    prevTotalRef.current = totalBlocks;
    prevStreamingRef.current = streaming;
    prevGenerationRef.current = generation;

    if (streaming || totalBlocks <= PROGRESSIVE_THRESHOLD) {
      setVisibleCount(totalBlocks);
      return;
    }

    // 非流式 + 大文档：totalBlocks 增加、streaming 变化、或 generation 变化时重置
    if (totalChanged || streamingChanged || generationChanged) {
      setVisibleCount(Math.min(INITIAL_BATCH, totalBlocks));
    }
  }, [totalBlocks, streaming, generation]);

  // 分帧追加
  useEffect(() => {
    if (streaming || visibleCount >= totalBlocks) return;

    // 标签页不可见时直接全量，避免 rIC/RAF 被冻结导致内容缺失
    if (typeof document !== 'undefined' && document.hidden) {
      setVisibleCount(totalBlocks);
      return;
    }

    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;

      // 优先用 requestIdleCallback，降级用 requestAnimationFrame
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(
          () => {
            if (cancelled) return;
            setVisibleCount((prev) => {
              const next = Math.min(prev + BATCH_SIZE, totalBlocks);
              return next;
            });
          },
          { timeout: 80 },
        );
      } else {
        requestAnimationFrame(() => {
          if (cancelled) return;
          setVisibleCount((prev) =>
            Math.min(prev + BATCH_SIZE, totalBlocks),
          );
        });
      }
    };

    scheduleNext();

    // 标签页可见性变化时：切到后台直接全量
    const handleVisibility = () => {
      if (document.hidden) {
        cancelled = true;
        setVisibleCount(totalBlocks);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      cancelled = true;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [visibleCount, totalBlocks, streaming]);

  return visibleCount;
}
