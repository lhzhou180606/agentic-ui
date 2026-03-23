import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface AnimationConfig {
  /** 淡入动画持续时间（ms），默认 250 */
  fadeDuration?: number;
  /** 缓动函数，默认 ease-out */
  easing?: string;
}

export interface AnimationTextProps {
  children: React.ReactNode;
  animationConfig?: AnimationConfig;
}

/**
 * 提取 React children 的纯文本
 */
const extractText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (React.isValidElement(children) && children.props?.children) {
    return extractText(children.props.children);
  }
  return '';
};

/**
 * 识别 children 中是否包含 React 元素节点。
 * 富文本结构（链接、脚注、图片等）在纯文本差分下会丢失结构信息，直接透传更安全。
 */
const hasElementNode = (children: React.ReactNode): boolean => {
  if (
    children === null ||
    children === undefined ||
    typeof children === 'boolean'
  )
    return false;
  if (typeof children === 'string' || typeof children === 'number')
    return false;
  if (Array.isArray(children)) return children.some(hasElementNode);
  return React.isValidElement(children);
};

/**
 * 流式文字淡入动画组件。
 *
 * 采用 opacity + translateY（GPU 硬件加速），清爽流派。
 * 同一段流式前缀追加只触发**一次**入场动画；后续增量仅更新文案。内容被替换
 * （非前缀增长）时重新播放入场。动画结束后仍用 span 包裹以保持布局稳定。
 */
const AnimationText = React.memo<AnimationTextProps>(
  ({ children, animationConfig }) => {
    const { fadeDuration = 200, easing = 'ease-out' } = animationConfig || {};
    const [animComplete, setAnimComplete] = useState(false);
    const [animSession, setAnimSession] = useState(0);
    const prevTextRef = useRef('');

    const text = extractText(children);
    const hasElementContent = hasElementNode(children);

    useEffect(() => {
      if (hasElementContent) {
        prevTextRef.current = text;
        return;
      }

      if (text === prevTextRef.current) return;

      const prev = prevTextRef.current;

      if (!prev) {
        if (!text) return;
        prevTextRef.current = text;
        setAnimComplete(false);
        return;
      }

      if (text.length > prev.length && text.startsWith(prev)) {
        prevTextRef.current = text;
        return;
      }

      setAnimComplete(false);
      setAnimSession((s) => s + 1);
      prevTextRef.current = text;
    }, [text, hasElementContent]);

    const handleAnimationEnd = () => setAnimComplete(true);

    const animationStyle = useMemo(
      () => ({
        display: 'inline-block',
        animation: `markdownRendererSlideFadeIn ${fadeDuration}ms ${easing} forwards`,
        willChange: 'opacity, transform',
        color: 'inherit',
      }),
      [fadeDuration, easing],
    );

    /** 动画结束后仍用 inline-block 包裹，避免从 span 变为裸内容时的宽度重排 */
    const doneChunkStyle = useMemo(
      () => ({
        display: 'inline-block' as const,
        color: 'inherit',
      }),
      [],
    );

    if (hasElementContent) {
      return <>{children}</>;
    }

    return animComplete ? (
      <span style={doneChunkStyle}>{children}</span>
    ) : (
      <span
        key={animSession}
        style={animationStyle}
        onAnimationEnd={handleAnimationEnd}
      >
        {children}
      </span>
    );
  },
);

AnimationText.displayName = 'AnimationText';

export default AnimationText;
