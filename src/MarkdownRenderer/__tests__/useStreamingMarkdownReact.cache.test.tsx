import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as markdownReactShared from '../markdownReactShared';
import { useStreamingMarkdownReact } from '../streaming/useStreamingMarkdownReact';

/**
 * 密封块缓存与 Bubble 侧稳定 fncProps 配套：
 * - 末块增长 / fncProps 仅换引用：密封块不应重复 renderMarkdownBlock
 * - remarkPlugins 变引用导致 processor 重建：应清空缓存并重新 parse（与 useEffect 仅依赖 processor 一致）
 */
describe('useStreamingMarkdownReact sealed subtree cache', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call renderMarkdownBlock again for sealed blocks when only the tail block grows', () => {
    const spy = vi.spyOn(markdownReactShared, 'renderMarkdownBlock');

    const md1 = 'sealed\n\n\n';
    const md2 = 'sealed\n\n\ntail';

    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useStreamingMarkdownReact(content, {
          streaming: true,
          contentRevisionSource: content,
        }),
      { initialProps: { content: md1 } },
    );

    const countAfterFirst = spy.mock.calls.length;
    expect(countAfterFirst).toBeGreaterThan(0);

    rerender({ content: md2 });

    expect(spy.mock.calls.length - countAfterFirst).toBe(1);
  });

  it('fncProps 仅换引用时密封块不应再次 renderMarkdownBlock', () => {
    const spy = vi.spyOn(markdownReactShared, 'renderMarkdownBlock');

    const md1 = 'sealed\n\n\n';
    const md2 = 'sealed\n\n\ntail';

    const { rerender } = renderHook(
      ({ content, fp }: { content: string; fp: Record<string, unknown> }) =>
        useStreamingMarkdownReact(content, {
          streaming: true,
          contentRevisionSource: content,
          fncProps: fp as any,
        }),
      { initialProps: { content: md1, fp: { tag: 'a' } } },
    );

    const afterFirst = spy.mock.calls.length;
    expect(afterFirst).toBeGreaterThan(0);

    rerender({ content: md2, fp: { tag: 'b' } });

    expect(spy.mock.calls.length - afterFirst).toBe(1);
  });

  it('remarkPlugins 引用变化导致 processor 重建时，密封块会再次 renderMarkdownBlock', () => {
    const spy = vi.spyOn(markdownReactShared, 'renderMarkdownBlock');
    const noop = () => {};
    const fixedMd = 'sealed\n\n\n';

    const { rerender } = renderHook(
      ({ plugins }: { plugins: unknown[] }) =>
        useStreamingMarkdownReact(fixedMd, {
          streaming: true,
          contentRevisionSource: fixedMd,
          remarkPlugins: plugins,
        }),
      { initialProps: { plugins: [noop] } },
    );

    expect(spy.mock.calls.length).toBeGreaterThan(0);
    spy.mockClear();

    rerender({ plugins: [noop] });

    expect(spy.mock.calls.length).toBeGreaterThan(0);
  });
});
