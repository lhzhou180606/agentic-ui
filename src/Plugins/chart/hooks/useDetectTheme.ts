import { useEffect, useState } from 'react';

/**
 * 主题检测配置选项
 */
export interface DetectThemeOptions {
  /**
   * 用于检测主题的 CSS 变量名
   * @default '--color-gray-bg-page'
   */
  cssVariable?: string;
  /**
   * 亮度阈值，低于此值认为是暗色主题
   * @default 145
   */
  darknessThreshold?: number;
  /**
   * 是否监听主题变化
   * @default true
   */
  observeChanges?: boolean;
}

/**
 * 解析颜色值为 RGB
 */
const parseColorToRgb = (
  color: string,
): { r: number; g: number; b: number } | null => {
  const normalizedColor = color.trim().toLowerCase();

  // 短十六进制格式 #rgb
  const shortHexMatch = normalizedColor.match(/^#([0-9a-f]{3})$/i);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split('').map((char) => {
      return Number.parseInt(char + char, 16);
    });
    return { r, g, b };
  }

  // 标准十六进制格式 #rrggbb
  const hexMatch = normalizedColor.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    return {
      r: Number.parseInt(hexMatch[1].slice(0, 2), 16),
      g: Number.parseInt(hexMatch[1].slice(2, 4), 16),
      b: Number.parseInt(hexMatch[1].slice(4, 6), 16),
    };
  }

  // rgb/rgba 格式
  const rgbMatch = normalizedColor.match(
    /^rgba?\((\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,]+[\d.]+)?\)$/i,
  );
  if (rgbMatch) {
    return {
      r: Number.parseInt(rgbMatch[1], 10),
      g: Number.parseInt(rgbMatch[2], 10),
      b: Number.parseInt(rgbMatch[3], 10),
    };
  }

  return null;
};

/**
 * 计算颜色的亮度
 * 使用加权公式：Y = 0.299*R + 0.587*G + 0.114*B
 */
const calculateBrightness = (color: string): number | null => {
  const rgb = parseColorToRgb(color);
  if (!rgb) return null;
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
};

/**
 * 检测背景色是否为暗色
 */
const isDarkBackground = (
  color: string,
  threshold: number = 145,
): boolean => {
  const brightness = calculateBrightness(color);
  if (brightness === null) return false;
  return brightness < threshold;
};

/**
 * 检测 HTML 元素的 data-theme 属性是否为 dark
 */
const checkDataTheme = (): boolean => {
  if (typeof document === 'undefined') return false;
  const htmlElement = document.documentElement;
  return htmlElement.getAttribute('data-theme') === 'dark';
};

/**
 * 获取 CSS 变量的计算值
 */
const getCSSVariableValue = (variableName: string): string | null => {
  if (typeof window === 'undefined') return null;
  const computedStyle = window.getComputedStyle(document.documentElement);
  const value = computedStyle.getPropertyValue(variableName).trim();
  return value || null;
};

/**
 * 根据多种方式检测当前主题
 */
const detectTheme = (
  cssVariable: string,
  darknessThreshold: number,
): 'light' | 'dark' => {
  // 1. 首先检查 html[data-theme='dark']
  if (checkDataTheme()) {
    return 'dark';
  }

  // 2. 检查 CSS 变量的亮度
  const cssValue = getCSSVariableValue(cssVariable);
  if (cssValue && isDarkBackground(cssValue, darknessThreshold)) {
    return 'dark';
  }

  // 3. 检查背景色 CSS 变量
  const bgColor = getCSSVariableValue('--color-gray-bg-page');
  if (bgColor && isDarkBackground(bgColor, darknessThreshold)) {
    return 'dark';
  }

  return 'light';
};

/**
 * 自动检测当前主题的 Hook
 *
 * 检测策略（按优先级）：
 * 1. 检查 `html[data-theme='dark']` 属性
 * 2. 检查指定 CSS 变量的亮度值
 * 3. 检查 `--color-gray-bg-page` 的亮度值
 *
 * @param options 检测配置选项
 * @returns 检测到的主题 'light' | 'dark'
 *
 * @example
 * ```tsx
 * const theme = useDetectTheme();
 * // theme: 'light' | 'dark'
 *
 * // 自定义配置
 * const theme = useDetectTheme({
 *   cssVariable: '--color-primary-bg-page',
 *   darknessThreshold: 128,
 *   observeChanges: true,
 * });
 * ```
 */
export const useDetectTheme = (
  options: DetectThemeOptions = {},
): 'light' | 'dark' => {
  const {
    cssVariable = '--color-gray-bg-page',
    darknessThreshold = 145,
    observeChanges = true,
  } = options;

  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    detectTheme(cssVariable, darknessThreshold),
  );

  useEffect(() => {
    if (!observeChanges) return;

    const updateTheme = () => {
      setTheme(detectTheme(cssVariable, darknessThreshold));
    };

    // 监听 data-theme 属性变化
    const htmlElement = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          updateTheme();
          break;
        }
      }
    });

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });

    // 监听 prefers-color-scheme 变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      updateTheme();
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    // 初始检测
    updateTheme();

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [cssVariable, darknessThreshold, observeChanges]);

  return theme;
};

export default useDetectTheme;