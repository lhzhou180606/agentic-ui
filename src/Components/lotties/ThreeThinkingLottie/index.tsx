import Lottie from 'lottie-react';
import React, { useEffect, useState } from 'react';

export interface ThreeThinkingLottieProps {
  /**
   * 是否自动播放动画
   * @default true
   */
  autoplay?: boolean;
  /**
   * 是否循环播放动画
   * @default true
   */
  loop?: boolean;
  /**
   * 动画容器类名
   */
  className?: string;
  /**
   * 动画容器样式
   */
  style?: React.CSSProperties;
  /**
   * 动画尺寸
   * @default 32
   */
  size?: number;
  /**
   * 加载占位符
   */
  fallback?: React.ReactNode;
}

/**
 * ThreeThinkingLottie 组件 - 支持按需加载的思考动画组件
 *
 * 该组件使用动态 import 实现 lottie JSON 文件的按需加载，
 * 避免将动画数据打包进主包，减少首屏加载体积。
 *
 * @component
 * @description 支持按需加载的 Lottie 思考动画组件
 * @param {ThreeThinkingLottieProps} props - 组件属性
 * @param {boolean} [props.autoplay=true] - 是否自动播放动画
 * @param {boolean} [props.loop=true] - 是否循环播放动画
 * @param {string} [props.className] - 动画容器类名
 * @param {React.CSSProperties} [props.style] - 动画容器样式
 * @param {number} [props.size=32] - 动画尺寸
 * @param {React.ReactNode} [props.fallback] - 加载占位符
 *
 * @example
 * ```tsx
 * // 基础用法
 * <ThreeThinkingLottie />
 *
 * // 自定义尺寸
 * <ThreeThinkingLottie size={48} />
 *
 * // 自定义加载占位符
 * <ThreeThinkingLottie fallback={<Spin />} />
 * ```
 *
 * @returns {React.ReactElement} 渲染的 Lottie 思考动画组件
 *
 * @remarks
 * - 使用动态 import 按需加载 lottie JSON 文件
 * - 减少首屏加载体积
 * - 支持自定义加载占位符
 * - 支持自定义尺寸和样式
 */
export const ThreeThinkingLottie: React.FC<ThreeThinkingLottieProps> = ({
  autoplay = true,
  loop = true,
  className,
  style,
  size = 32,
  fallback,
}) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // 动态加载 lottie JSON 文件
    import('./three-thinking.json')
      .then((data) => {
        setAnimationData(data.default || data);
      })
      .catch((error) => {
        console.error('Failed to load ThreeThinkingLottie animation:', error);
      });
  }, []);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  };

  // 默认占位符
  const defaultFallback = (
    <div style={containerStyle} className={className}>
      <span style={{ opacity: 0.3 }}>...</span>
    </div>
  );

  if (!animationData) {
    return fallback !== undefined ? (
      <>{fallback}</>
    ) : (
      defaultFallback
    );
  }

  return (
    <Lottie
      style={containerStyle}
      className={className}
      aria-hidden="true"
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
    />
  );
};

export default ThreeThinkingLottie;