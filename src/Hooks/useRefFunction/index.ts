import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * useRefFunction Hook - 稳定函数引用 Hook
 *
 * 创建一个引用恒定的函数包装器，包装器内部始终调用最新一次渲染传入的函数实现，
 * 从而避免父组件重渲染时把"新函数引用"透传给子组件，造成子组件不必要的重新渲染。
 *
 * @description 稳定的函数引用包装器，等价于 React 团队推荐的 latestRef 模式
 * @template T - 被包装函数的类型
 * @param {T} reFunction - 当前渲染要保存的最新函数实现
 * @returns {T} 引用恒定的函数包装器，可安全作为子组件 prop 或 effect deps
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const [count, setCount] = useState(0);
 *   const handleClick = useRefFunction((value: number) => {
 *     setCount(count + value);
 *   });
 *   return <ChildComponent onClick={handleClick} />;
 * };
 * ```
 *
 * @remarks
 * - 不可在渲染期间同步调用返回的包装器，effect/事件回调中使用是安全的
 * - 用 useLayoutEffect 而非渲染期写 ref，避免 R18 并发渲染下被丢弃的渲染版本污染 ref
 */
const useRefFunction = <T extends (...args: any[]) => any>(reFunction: T) => {
  // 初始值设为 reFunction 以保证首次 render 期间包装器即可被调用（如在 useMemo 中）。
  // useLayoutEffect 在后续每次 commit 阶段同步写入最新版本，保证 effect/事件
  // 回调里读取的 ref 永远是最新的函数实现。
  const ref = useRef<T>(reFunction);
  useLayoutEffect(() => {
    ref.current = reFunction;
  });
  return useCallback((...rest: Parameters<T>): ReturnType<T> => {
    return ref.current(...rest);
  }, []);
};

export { useRefFunction };
