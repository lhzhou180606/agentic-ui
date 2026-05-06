import React from 'react';
import { EXTRA_SCROLL_OFFSET } from '../constants';

/**
 * 检测文本是否溢出，并为溢出的元素写入用于 CSS 动画的 CSS 变量。
 *
 * 之前内联在 HistoryItem.tsx 顶部，作为 hook 既不利于单测、也无法被其他组件复用。
 * 提到独立文件后职责单一，HistoryItem 只需 import 使用。
 *
 * @param text 需要监测溢出的文本内容；变化时会重新计算
 * @returns `textRef` 挂到目标 DOM；`isTextOverflow` 表示当前是否溢出
 */
export const useTextOverflow = (text: React.ReactNode) => {
  const textRef = React.useRef<HTMLDivElement>(null);
  const [isTextOverflow, setIsTextOverflow] = React.useState(false);

  React.useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const isOverflow = el.scrollWidth > el.clientWidth;
    // 仅在溢出状态变化时更新，避免冗余渲染
    setIsTextOverflow((prev) => (prev === isOverflow ? prev : isOverflow));
    el.setAttribute('data-overflow', String(isOverflow));

    if (isOverflow) {
      const scrollDistance = -(
        el.scrollWidth -
        el.clientWidth +
        EXTRA_SCROLL_OFFSET
      );
      el.style.setProperty('--scroll-width', `${scrollDistance}px`);
      // 根据滚动距离动态计算动画时长，保持恒定滚动速度（每 100px 约 1.5s）
      const duration = Math.max(2, (Math.abs(scrollDistance) / 100) * 1.5);
      el.style.setProperty('--scroll-duration', `${duration}s`);
    }
  }, [text]);

  return { textRef, isTextOverflow };
};
