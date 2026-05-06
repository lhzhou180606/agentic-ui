import {
  ChatTokenType,
  GenerateStyle,
  useEditorStyleRegister,
} from '../Hooks/useStyle';

const genStyle: GenerateStyle<ChatTokenType> = (token) => {
  return {
    [token.componentCls]: {
      position: 'relative',
      display: 'inline-block',
      width: 'fit-content',
      margin: 0,
      padding: 0,
      // 视觉规范固定为 11px / 4px 圆角，此处保持字面量以与设计稿对齐
      fontSize: 11,
      lineHeight: 1,
      listStyle: 'none',
      verticalAlign: 'middle',
      boxSizing: 'border-box',

      [`${token.componentCls}-dot`]: {
        display: 'inline-flex',
        justifyContent: 'center',
        padding: '3px 4px',
        textAlign: 'center',
        // 默认描边色：偏冷的浅蓝半透明，与图标渐变呼应；
        // 当前 design token 体系无完全等价 token，保持字面量并集中维护于此
        border: '1px solid rgba(191, 215, 240, 0.25)',
        borderRadius: token.borderRadiusSM ?? 4,
        // 状态切换时统一过渡，避免在 emphasis / tooltip-visible 切换时跳变
        transition:
          'background 0.2s ease-in-out, border-color 0.2s ease-in-out',
      },

      [`&${token.componentCls}-status-watermark`]: {
        [`${token.componentCls}-dot`]: {
          background: 'transparent',
          border: '1px solid var(--color-gray-border-light)',
          backdropFilter: 'blur(40px)',
        },
      },

      [`&${token.componentCls}-status-emphasis`]: {
        [`${token.componentCls}-dot`]: {
          background:
            'linear-gradient(180deg, var(--color-primary-bg-page-light) 0%, var(--color-primary-bg-page) 100%)',
          border: '1px solid var(--color-gray-bg-card-white)',
        },
      },

      [`&${token.componentCls}-with-children`]: {
        [`${token.componentCls}-dot`]: {
          position: 'absolute',
          top: 0,
          insetInlineEnd: 0,
          transform: 'translate(50%, -50%)',
          transformOrigin: '100% 0%',
        },
      },

      // tooltip 打开时的高亮渐变。仅对 default / watermark 状态生效；
      // emphasis 已经有自己的强调渐变，不应被覆盖（视觉一致性 + 避免抢戏）
      [`&${token.componentCls}-tooltip-visible:not(${token.componentCls}-status-emphasis)`]:
        {
          [`${token.componentCls}-dot`]: {
            background:
              'linear-gradient(293deg, var(--color-primary-bg-page-light) 39%, var(--color-primary-bg-page) 62%, var(--color-primary-bg-page-light) 91%)',
            backdropFilter: 'blur(40px)',
          },
        },
    },
  };
};

/**
 * AILabel 默认 prefixCls。
 *
 * 也作为 `ConfigProvider.getPrefixCls(prefixCls)` 的入参，确保「样式注册」与「外部
 * prefix 推导」共享同一字符串字面量，避免散落的 magic string 不一致。
 */
export const prefixCls = 'ai-label';

/**
 * AILabel 样式 hook。
 *
 * @param customPrefixCls - 实际拼接的类名前缀（通常为 `ConfigProvider.getPrefixCls(prefixCls)`
 *   的返回值，例如 `ant-ai-label`）。未传时回退到 {@link prefixCls}。
 *
 * 注意：useEditorStyleRegister 的第一个参数（注册名）固定为 {@link prefixCls}，
 * 与 hash 缓存 key 强绑定；类名前缀（`componentCls`）则使用 `customPrefixCls` 拼接，
 * 二者职责不同。
 */
export function useStyle(customPrefixCls?: string) {
  return useEditorStyleRegister(prefixCls, (token) => {
    const badgeToken = {
      ...token,
      componentCls: `.${customPrefixCls ?? prefixCls}`,
    };
    return [genStyle(badgeToken)];
  });
}
