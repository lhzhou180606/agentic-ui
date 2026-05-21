import React, { memo, useCallback, useState } from 'react';
import { TEXT_SWAP_BLUR_PX } from '../../Components/TextSwap/constants';

/**
 * 分帧渐进新增块的模糊淡入包装。
 * 仅在首次挂载时播放一次 blur + opacity 入场动画，避免突然出现造成闪动。
 * 动画结束后切换为 display:contents，不影响布局。
 */

const FADE_DURATION_MS = 250;

const animatingStyle: React.CSSProperties = {
  animation: `agenticProgressiveFadeIn ${FADE_DURATION_MS}ms ease-out both`,
};

const doneStyle: React.CSSProperties = {
  display: 'contents',
};

let styleInjected = false;
function ensureStyleInjected(): void {
  if (styleInjected || typeof document === 'undefined') return;
  styleInjected = true;
  const el = document.createElement('style');
  el.textContent = `@keyframes agenticProgressiveFadeIn{from{opacity:0;filter:blur(${TEXT_SWAP_BLUR_PX}px)}to{opacity:1;filter:blur(0)}}`;
  document.head.appendChild(el);
}

const ProgressiveFadeInComponent: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  ensureStyleInjected();
  const [done, setDone] = useState(false);
  const handleEnd = useCallback(() => setDone(true), []);

  if (done) {
    return <div style={doneStyle}>{children}</div>;
  }

  return (
    <div style={animatingStyle} onAnimationEnd={handleEnd}>
      {children}
    </div>
  );
};

ProgressiveFadeInComponent.displayName = 'ProgressiveFadeIn';

export const ProgressiveFadeIn = memo(ProgressiveFadeInComponent);
