import {
  ChatTokenType,
  GenerateStyle,
  useEditorStyleRegister,
} from '../../Hooks/useStyle';

import {
  DEFAULT_TEXT_SWAP_DURATION_MS,
  TEXT_SWAP_BLUR_PX,
  TEXT_SWAP_EASING,
  TEXT_SWAP_TRANSLATE_Y_PX,
} from './constants';

const genStyle: GenerateStyle<ChatTokenType> = (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '--text-swap-dur': `${DEFAULT_TEXT_SWAP_DURATION_MS}ms`,
      '--text-swap-translate-y': `${TEXT_SWAP_TRANSLATE_Y_PX}px`,
      '--text-swap-blur': `${TEXT_SWAP_BLUR_PX}px`,
      '--text-swap-ease': TEXT_SWAP_EASING,

      display: 'inline-block',
      minWidth: 0,
      maxWidth: '100%',
      verticalAlign: 'bottom',
      transform: 'translateY(0)',
      filter: 'blur(0)',
      opacity: 1,
      transition: [
        `transform var(--text-swap-dur) var(--text-swap-ease)`,
        `filter var(--text-swap-dur) var(--text-swap-ease)`,
        `opacity var(--text-swap-dur) var(--text-swap-ease)`,
      ].join(','),
      willChange: 'transform, filter, opacity',

      '&-exit': {
        transform: 'translateY(calc(var(--text-swap-translate-y) * -1))',
        filter: 'blur(var(--text-swap-blur))',
        opacity: 0,
      },

      '&-enter-start': {
        transform: 'translateY(var(--text-swap-translate-y))',
        filter: 'blur(var(--text-swap-blur))',
        opacity: 0,
        transition: 'none',
      },
    },

    '@media (prefers-reduced-motion: reduce)': {
      [componentCls]: {
        transition: 'none !important',
      },
    },
  };
};

export function useTextSwapStyle(prefixCls?: string) {
  return useEditorStyleRegister('text-swap', (token) => {
    const textSwapToken = {
      ...token,
      componentCls: `.${prefixCls}`,
    };
    return [genStyle(textSwapToken)];
  });
}
