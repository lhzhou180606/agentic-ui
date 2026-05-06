import { useEffect, useMemo, useState } from 'react';
import { useRefFunction } from '../../Hooks/useRefFunction';
import { HistoryProps } from '../types';
import { HistoryDataType } from '../types/HistoryData';

/**
 * 根据关键词从列表中过滤
 */
function filterListByKeyword(
  list: HistoryDataType[],
  keyword: string,
): HistoryDataType[] {
  if (!keyword.trim()) return list;
  const lower = keyword.toLowerCase();
  return list.filter((item) => {
    const title =
      typeof item.sessionTitle === 'string'
        ? item.sessionTitle
        : String(item.sessionTitle || '');
    return title.toLowerCase().includes(lower);
  });
}

/**
 * 浅比较两个历史列表是否在「展示语义」上完全一致。
 *
 * 用于 loadHistory 后判断是否真的需要 setChatList：
 * 当 actionRef.reload() 拉到的新列表与现有列表内容相同（同 sessionId / gmtCreate / 收藏态）时，
 * 跳过 setState 即可保留 chatList 的引用稳定性，避免下游 useMemo / React.memo 大面积失效，
 * GroupMenu 不必白白重渲一遍。
 *
 * 注意：故意只比较少量「会影响渲染」的字段，而不是 deep equal —— 整体 deep equal 在长列表下成本过高，
 * 收益却很小（同一 sessionId 的 displayTitle 等字段更新本来就该触发 re-render）。
 */
function isHistoryListVisuallyEqual(
  prev: HistoryDataType[],
  next: HistoryDataType[],
): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    if (
      a.sessionId !== b.sessionId ||
      a.gmtCreate !== b.gmtCreate ||
      a.isFavorite !== b.isFavorite ||
      a.sessionTitle !== b.sessionTitle ||
      a.status !== b.status
    ) {
      return false;
    }
  }
  return true;
}

/**
 * 历史记录状态管理 Hook
 */
export const useHistory = (props: HistoryProps) => {
  const [open, setOpen] = useState(false);
  // 直接使用 state 管理列表，避免 ref + 哨兵 state 的反模式：
  // 之前用 chatListRef + listVersion 是为了「绕过 useMemo 依赖检查」，但 ref 改动并不会驱动子组件重渲染，
  // 实际渲染依赖的依然是 setListVersion。改为真正的 state 后，依赖关系显式且可被 lint 校验。
  const [chatList, setChatList] = useState<HistoryDataType[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredList = useMemo(
    () => filterListByKeyword(chatList, searchKeyword),
    [chatList, searchKeyword],
  );

  const loadHistory = useRefFunction(async () => {
    // 防御 props.request 为 undefined：之前 `props?.request?.(...).then(...)` 在 request 缺失时会
    // 对 undefined 调用 .then 抛 TypeError，再被 `as HistoryDataType[]` 强行掩盖。
    if (!props.request) return;
    try {
      const list = await props.request({ agentId: props.agentId });
      const safeList = Array.isArray(list) ? list : [];
      // referential equality 优化：当新列表在展示语义上与旧列表完全一致时，
      // 用函数式 setState 返回旧引用，让 React 的 bail-out 跳过下游所有重渲。
      // 之前每次 reload 都无脑 setChatList(list)，会让 GroupMenu / useMemo 全量失效。
      setChatList((prev) =>
        isHistoryListVisuallyEqual(prev, safeList) ? prev : safeList,
      );
    } catch (error) {
      // 失败时回退为空列表，并把错误打到控制台，避免在 React 树中抛出未捕获 Promise。
      // 不直接 throw，保证 actionRef.reload() 调用方不需要也包 try/catch。
      // 同样用函数式 setState 走 bail-out，避免空 → 空也触发重渲。
      // eslint-disable-next-line no-console
      console.error('[History] loadHistory failed:', error);
      setChatList((prev) => (prev.length === 0 ? prev : []));
    }
  });

  // 暴露 reload 方法给 actionRef
  useEffect(() => {
    if (props.actionRef) {
      props.actionRef.current = {
        reload: loadHistory,
      };
    }
  }, [props.actionRef, loadHistory]);

  // 仅在挂载时触发 onInit / onShow，故意不把它们放进依赖数组：
  // 这两个回调表达「组件首次出现」的语义，重复触发会破坏调用方的副作用。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    props.onInit?.();
    props.onShow?.();
  }, []);

  // 当 sessionId 或 request 改变时重新加载数据
  useEffect(() => {
    if (props.sessionId) {
      setSelectedIds([props.sessionId]);
    }
    loadHistory();
  }, [props.sessionId, props.request, loadHistory]);

  // 处理收藏
  const handleFavorite = useRefFunction(
    async (sessionId: string, isFavorite: boolean) => {
      await props.agent?.onFavorite?.(sessionId, isFavorite);
      setChatList((prev) =>
        prev.map((item) =>
          item.sessionId === sessionId ? { ...item, isFavorite } : item,
        ),
      );
    },
  );

  // 处理多选 —— 用函数式 setState 避免闭包陈旧
  const handleSelectionChange = useRefFunction(
    (sessionId: string, checked: boolean) => {
      setSelectedIds((prev) => {
        const next = checked
          ? [...prev, sessionId]
          : prev.filter((id) => id !== sessionId);
        props.agent?.onSelectionChange?.(next);
        return next;
      });
    },
  );

  // 处理搜索
  const handleSearch = useRefFunction((value: string) => {
    setSearchKeyword(value);
    props.agent?.onSearch?.(value);
  });

  // 处理加载更多
  const handleLoadMore = useRefFunction(async () => {
    await props.agent?.onLoadMore?.();
  });

  // 处理新对话
  const handleNewChat = useRefFunction(async () => {
    await props.agent?.onNewChat?.();
    setOpen(false);
  });

  return {
    open,
    setOpen,
    chatList,
    searchKeyword,
    selectedIds,
    filteredList,
    loadHistory,
    handleFavorite,
    handleSelectionChange,
    handleSearch,
    handleLoadMore,
    handleNewChat,
  };
};
