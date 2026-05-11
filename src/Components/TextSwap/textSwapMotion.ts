import type { CSSObject } from '@ant-design/cssinjs';

/** 与 TextSwap 入场观感一致的单段 @keyframes 名称；供表格行、流式段落等复用。 */
export const TEXT_SWAP_ENTER_KEYFRAME_NAME = 'agenticTextSwapEnter' as const;

/** MarkdownEditor 表格、MarkdownRenderer 流式文字共用同一套 keyframes。 */
export const textSwapEnterKeyframes: Record<string, CSSObject> = {
  [`@keyframes ${TEXT_SWAP_ENTER_KEYFRAME_NAME}`]: {
    from: {
      opacity: 0,
      transform: 'translateY(8px)',
      filter: 'blur(2px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
      filter: 'blur(0)',
    },
  },
};

export function textSwapEnterAnimationForwards(
  durationMs: number,
  easing: string = 'ease-out',
): string {
  return `${TEXT_SWAP_ENTER_KEYFRAME_NAME} ${durationMs}ms ${easing} forwards`;
}

export function textSwapEnterAnimationBoth(
  durationMs: number,
  easing: string = 'ease-out',
): string {
  return `${TEXT_SWAP_ENTER_KEYFRAME_NAME} ${durationMs}ms ${easing} both`;
}
