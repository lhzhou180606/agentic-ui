import { ConfigProvider, Tooltip, TooltipProps } from 'antd';
import classNames from 'clsx';
import { isObject } from 'lodash-es';
import React, {
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  useScrollVisible,
  UseScrollVisibleProps,
} from './hooks/useScrollVisible';
import { prefixCls, useStyle } from './style';

const DEFAULT_VISIBLE_THRESHOLD = 400;
/** 退出动画时长（毫秒），需与 style.ts 中的 transition 时长保持一致 */
const PRESENCE_EXIT_DURATION_MS = 180;

const getDefaultTarget = () => window;

const getShouldVisibleHandler = (
  propsShouldVisible: number | UseScrollVisibleProps['shouldVisible'],
): UseScrollVisibleProps['shouldVisible'] => {
  return (scrollTop, container) => {
    if (typeof propsShouldVisible === 'function') {
      return propsShouldVisible(scrollTop, container);
    }
    return scrollTop >= propsShouldVisible;
  };
};

const getTooltipProps = (
  tooltip: React.ReactNode | TooltipProps,
): TooltipProps => {
  if (isObject(tooltip) && !isValidElement(tooltip)) {
    return tooltip as TooltipProps;
  }
  return { title: tooltip };
};

/**
 * ScrollVisibleButton 组件属性
 */
export interface ScrollVisibleButtonProps extends Omit<
  React.DOMAttributes<HTMLButtonElement>,
  'onClick'
> {
  /** 自动化测试用按钮标识，未设置时默认与主题前缀一致 */
  'data-testid'?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 提示信息 */
  tooltip?: React.ReactNode | TooltipProps;
  /** 滚动目标元素 */
  target?: () => HTMLElement | Window;
  /** 按钮显示条件 @default 400 */
  shouldVisible?: number | UseScrollVisibleProps['shouldVisible'];
  /** 点击回调 */
  onClick?: (
    e: React.MouseEvent<HTMLButtonElement> | undefined,
    container: HTMLElement | Window,
  ) => void;
}

export type ScrollVisibleButtonRef = {
  nativeElement: HTMLButtonElement | null;
};

/**
 * ScrollVisibleButton 组件
 *
 * 根据滚动位置显示/隐藏的按钮，支持平滑动画效果
 *
 * @example
 * ```tsx
 * <ScrollVisibleButton
 *   tooltip="返回顶部"
 *   shouldVisible={400}
 *   onClick={handleClick}
 * >
 *   <ArrowUpIcon />
 * </ScrollVisibleButton>
 * ```
 */
export const ScrollVisibleButton = forwardRef<
  ScrollVisibleButtonRef,
  ScrollVisibleButtonProps
>(
  (
    {
      className,
      style,
      shouldVisible: propsShouldVisible = DEFAULT_VISIBLE_THRESHOLD,
      target,
      onClick,
      tooltip,
      children,
      'data-testid': dataTestId,
      ...rest
    },
    ref,
  ) => {
    const context = useContext(ConfigProvider.ConfigContext);
    const baseCls = context?.getPrefixCls(prefixCls);
    const { wrapSSR, hashId } = useStyle(baseCls);

    const internalRef = React.useRef<HTMLButtonElement | null>(null);

    useImperativeHandle(ref, () => ({
      nativeElement: internalRef.current,
    }));

    const getTarget = target || getDefaultTarget;
    const shouldVisible = getShouldVisibleHandler(propsShouldVisible);

    const { visible, currentContainer } = useScrollVisible({
      target: getTarget,
      shouldVisible,
    });

    // 替代 framer-motion 的 AnimatePresence + exit 动画：
    // 通过本地 shouldRender + dataState 实现"显示时立即挂载、隐藏时延迟卸载"。
    const [shouldRender, setShouldRender] = useState<boolean>(visible);
    const [dataState, setDataState] = useState<'enter' | 'exit'>(
      visible ? 'enter' : 'exit',
    );

    useEffect(() => {
      if (visible) {
        setShouldRender(true);
        // 在挂载后下一帧切到 enter，触发 opacity 过渡
        const raf = requestAnimationFrame(() => setDataState('enter'));
        return () => cancelAnimationFrame(raf);
      }
      // 退出：先切到 exit 触发淡出，过渡结束后卸载
      setDataState('exit');
      const timer = window.setTimeout(() => {
        setShouldRender(false);
      }, PRESENCE_EXIT_DURATION_MS);
      return () => {
        window.clearTimeout(timer);
      };
    }, [visible]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e, currentContainer.current);
    };

    const button = (
      <button
        ref={internalRef}
        className={classNames(baseCls, className, hashId)}
        data-testid={dataTestId ?? baseCls}
        style={style}
        type="button"
        onClick={handleClick}
        {...rest}
      >
        <div className={`${baseCls}-content ${hashId}`}>{children}</div>
      </button>
    );

    const buttonWithTooltip = tooltip ? (
      <Tooltip {...getTooltipProps(tooltip)}>{button}</Tooltip>
    ) : (
      button
    );

    return wrapSSR(
      <>
        {shouldRender ? (
          <div
            className={`${baseCls}-presence ${hashId}`}
            data-state={dataState}
          >
            {buttonWithTooltip}
          </div>
        ) : null}
      </>,
    );
  },
);
