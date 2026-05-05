import Lottie from 'lottie-react';
import React, { useMemo } from 'react';
import { useAsyncLottieData } from './useAsyncLottieData';

/**
 * 通用 Lottie 组件 Props
 */
export interface BaseLottieProps {
  /** 是否自动播放动画 */
  autoplay?: boolean;
  /** 是否循环播放动画 */
  loop?: boolean;
  /** 动画容器类名 */
  className?: string;
  /** 动画容器样式 */
  style?: React.CSSProperties;
  /** 动画尺寸（宽度和高度） */
  size?: number | string;
  /** 加载占位符；未提供则渲染同尺寸空 div */
  fallback?: React.ReactNode;
}

interface CreateLottieComponentOptions {
  /** 动态 import 函数，例如 `() => import('./loading.json')` */
  loadJson: () => Promise<unknown>;
  /** 默认尺寸（覆盖 BaseLottieProps.size 的默认值） */
  defaultSize?: number | string;
  /** Lottie DOM 上额外的 data-testid */
  dataTestId?: string;
  /** 组件 displayName，便于 React DevTools 与 React.memo 兼容 */
  displayName?: string;
}

/**
 * 工厂：根据动态 import 与默认配置生成一个标准的 Lottie 包装组件。
 *
 * 用于消除 lotties/ 与 Robot/lotties/ 下大量结构完全相同的 Lottie 包装组件
 * （只有 `import('./xxx.json')` 与 displayName/默认尺寸不同）。
 */
export function createLottieComponent<P extends BaseLottieProps = BaseLottieProps>(
  options: CreateLottieComponentOptions,
): React.FC<P> {
  const {
    loadJson,
    defaultSize,
    dataTestId,
    displayName,
  } = options;

  const Component: React.FC<P> = (props) => {
    const {
      autoplay = true,
      loop = true,
      className,
      style,
      size = defaultSize,
      fallback,
    } = props;

    // loadJson 是工厂闭包变量，引用稳定；使用 useMemo 让 useAsyncLottieData 的 deps 稳定
    const stableLoad = useMemo(() => loadJson, []);
    const animationData = useAsyncLottieData(stableLoad);

    const containerStyle: React.CSSProperties = {
      width: size,
      height: size,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...style,
    };

    if (animationData === null || animationData === undefined) {
      if (fallback !== undefined) {
        return <>{fallback}</>;
      }
      return <div style={containerStyle} className={className} aria-hidden />;
    }

    return (
      <Lottie
        style={containerStyle}
        className={className}
        data-testid={dataTestId}
        aria-hidden="true"
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
      />
    );
  };

  if (displayName) {
    Component.displayName = displayName;
  }

  return Component;
}
