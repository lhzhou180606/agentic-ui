import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MarkdownInputFieldProps } from '../types/MarkdownInputFieldProps';

interface UseInputFieldGeometryParams {
  /** 是否处于放大态 */
  isEnlarged: boolean;
  /** 是否存在 toolsRender / actionsRender —— 决定底部是否独占一行，影响右内边距取舍 */
  hasTools?: boolean;
  /** 是否存在放大按钮（影响 minHeight 决策） */
  hasEnlargeAction: boolean;
  /** 是否存在 refinePrompt 按钮（影响 minHeight 决策） */
  hasRefineAction: boolean;
  /** 顶部 + 底部所有快捷/操作按钮总数（影响 minHeight 决策） */
  totalActionCount: number;
  /** 是否进入多行布局（影响 minHeight 决策） */
  isMultiRowLayout: boolean;
  /** 透传 props.maxHeight，用于折叠态高度计算 */
  maxHeight?: MarkdownInputFieldProps['maxHeight'];
  /** 透传 props.style，maxHeight/minHeight 优先级低于 maxHeight prop */
  style?: React.CSSProperties;
  /** 透传 props.attachment，启用附件时折叠态预留 90px */
  attachment?: { enable?: boolean };
}

interface UseInputFieldGeometryReturn {
  /** 输入框最外层容器 ref，用于 ResizeObserver 监听宽度，触发 collapseSendActions */
  inputRef: React.RefObject<HTMLDivElement>;
  /** 容器宽度小于阈值时折叠发送区操作按钮 */
  collapseSendActions: boolean;

  /**
   * 以下 setter 由 SendActions / QuickActions 在自身宽度变化时回调写入，
   * 进而参与 computedRightPadding 计算。
   * NOTE: 暂时仍以 setter 形式向主组件透出，下一步重构再收进 hook 内部。
   */
  setRightPadding: React.Dispatch<React.SetStateAction<number>>;
  setTopRightPadding: React.Dispatch<React.SetStateAction<number>>;
  setQuickRightOffset: React.Dispatch<React.SetStateAction<number>>;

  /** 编辑器 contentStyle.paddingRight 实际取值 */
  computedRightPadding: number;
  /** 折叠态下整个输入框的目标高度（含附件区预留） */
  collapsedHeightPx: number;
  /** 输入框最小高度，受放大态、按钮数量等影响 */
  computedMinHeight: number | string | undefined;
  /** 放大态下额外覆盖的内联样式 */
  enlargedStyle: React.CSSProperties;
}

/**
 * 输入框几何信息合并 Hook。
 *
 * 由 useMarkdownInputFieldLayout（容器尺寸 / 折叠状态 / setter）与
 * useMarkdownInputFieldStyles（基于上述状态计算的派生样式）合并而来。
 * 合并的目的是：消费侧只需关心一组最终值，避免主组件被迫充当中间胶水。
 */
export const useInputFieldGeometry = ({
  isEnlarged,
  hasTools,
  hasEnlargeAction,
  hasRefineAction,
  totalActionCount,
  isMultiRowLayout,
  maxHeight,
  style,
  attachment,
}: UseInputFieldGeometryParams): UseInputFieldGeometryReturn => {
  // ===== Layout 部分 =====
  const [collapseSendActions, setCollapseSendActions] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.innerWidth < 460) return true;
    return false;
  });

  const [rightPadding, setRightPadding] = useState(64);
  const [topRightPadding, setTopRightPadding] = useState(0);
  const [quickRightOffset, setQuickRightOffset] = useState(0);

  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    if (process.env.NODE_ENV === 'test') return;

    // 容器宽度小于 481 时折叠发送区按钮；observe() 会触发一次初始回调，无需手动初始化。
    // NOTE: 旧实现还维护了一份 `dimensions` state 和 `setCollapseSendActions` 对外 setter，
    // 但代码库中均无消费者（仅旧单测访问），合并到 useInputFieldGeometry 时一并移除。
    const handleResize = () => {
      if (!inputRef.current) return;
      if (process.env.NODE_ENV === 'test') return;
      if (inputRef.current.clientWidth < 481) {
        setCollapseSendActions(true);
      } else {
        setCollapseSendActions(false);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(inputRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // ===== Styles 部分 =====
  const computedRightPadding = useMemo(() => {
    const bottomOverlayPadding = hasTools ? 0 : rightPadding || 52;
    const topOverlayPadding = (topRightPadding || 0) + (quickRightOffset || 0);
    return Math.max(bottomOverlayPadding, topOverlayPadding);
  }, [hasTools, rightPadding, topRightPadding, quickRightOffset]);

  const collapsedHeight = useMemo(() => {
    // 优先使用 maxHeight prop，其次使用 style.maxHeight，最后使用默认值
    const maxHeightValue = maxHeight ?? style?.maxHeight;
    const base =
      typeof maxHeightValue === 'number'
        ? maxHeightValue
        : maxHeightValue
          ? parseFloat(String(maxHeightValue)) || 114
          : 114;
    return base;
  }, [maxHeight, style?.maxHeight]);

  const collapsedHeightPx = useMemo(() => {
    const extra = attachment?.enable ? 90 : 0;
    return collapsedHeight + extra;
  }, [collapsedHeight, attachment?.enable]);

  const computedMinHeight = useMemo(() => {
    if (isEnlarged) return 'auto';
    if (style?.minHeight !== undefined) return style.minHeight;
    // 同时存在放大按钮 + 提示词优化按钮，最小高度 140
    if (hasEnlargeAction && hasRefineAction) return 140;
    if (totalActionCount === 1) return 90;
    // 其他多行布局
    if (isMultiRowLayout) return 106;
    return style?.minHeight || 0;
  }, [
    isEnlarged,
    hasEnlargeAction,
    hasRefineAction,
    isMultiRowLayout,
    totalActionCount,
    style?.minHeight,
  ]);

  const enlargedStyle = useMemo<React.CSSProperties>(() => {
    if (!isEnlarged) return {};
    return {
      maxHeight: '980px',
      minHeight: '280px',
    };
  }, [isEnlarged]);

  return {
    inputRef,
    collapseSendActions,
    setRightPadding,
    setTopRightPadding,
    setQuickRightOffset,
    computedRightPadding,
    collapsedHeightPx,
    computedMinHeight,
    enlargedStyle,
  };
};
