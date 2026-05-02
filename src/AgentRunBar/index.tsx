import { PlusOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Tooltip, Typography } from 'antd';
import classNames from 'clsx';
import { motion } from 'framer-motion';
import React, { memo, useContext, useMemo } from 'react';
import { I18nContext } from '../I18n';
import {
  PauseIcon,
  PlayIcon,
  SimplePauseIcon,
  SimplePlayIcon,
  SimpleStopIcon,
  StopIcon,
} from './icons';
import Robot from './Robot';
import { useStyle } from './style';
export * from './Robot';

/**
 * 任务状态可选值列表
 *
 * @remarks
 * - `running`：任务正在运行中
 * - `success`：任务已成功完成
 * - `error`：任务执行出错
 * - `pause`：任务已暂停
 * - `stopped`：任务已停止
 * - `cancelled`：任务已取消
 */
export const TaskStatusList = [
  'running',
  'success',
  'error',
  'pause',
  'stopped',
  'cancelled',
] as const;

/**
 * 任务状态联合类型
 *
 * 表示一个任务的"宏观状态"（终态或主流程态）。
 * 与 {@link TaskRunningStatus} 的区别：
 * - `TaskStatus` 偏"宏观结果"（成功/失败/取消/已停止/暂停/运行中）
 * - `TaskRunningStatus` 偏"运行过程态"（运行中/已完成/已暂停）
 *
 * 在判断 UI 状态时通常需要两者组合，例如 `taskStatus='running' && taskRunningStatus='pause'`
 * 表示"任务整体在运行中、当前被用户暂停"。
 */
export type TaskStatus = (typeof TaskStatusList)[number];

/**
 * 任务运行状态可选值列表
 *
 * @remarks
 * - `running`：正在运行中
 * - `complete`：已完成
 * - `pause`：已暂停
 */
export const TaskRunningStatusList = ['running', 'complete', 'pause'] as const;

/**
 * 任务运行状态联合类型
 *
 * 表示任务运行过程中的"过程态"，详见 {@link TaskStatus} 的对比说明。
 */
export type TaskRunningStatus = (typeof TaskRunningStatusList)[number];

/**
 * 任务状态常量对象（向后兼容）
 *
 * 推荐直接使用字符串字面量（如 `'running'`），可获得更好的 tree-shaking 与类型推导。
 * 该对象保留以兼容旧代码 `TASK_STATUS.RUNNING` 的写法。
 */
export const TASK_STATUS = {
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  PAUSE: 'pause',
  STOPPED: 'stopped',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, TaskStatus>;

/**
 * 任务状态常量对象的类型（向后兼容）
 *
 * @deprecated 请直接使用 {@link TaskStatus} 联合类型
 */
export type TASK_STATUS = TaskStatus;

/**
 * 任务运行状态常量对象（向后兼容）
 *
 * 推荐直接使用字符串字面量（如 `'running'`），可获得更好的 tree-shaking 与类型推导。
 * 该对象保留以兼容旧代码 `TASK_RUNNING_STATUS.RUNNING` 的写法。
 */
export const TASK_RUNNING_STATUS = {
  RUNNING: 'running',
  COMPLETE: 'complete',
  PAUSE: 'pause',
} as const satisfies Record<string, TaskRunningStatus>;

/**
 * 任务运行状态常量对象的类型（向后兼容）
 *
 * @deprecated 请直接使用 {@link TaskRunningStatus} 联合类型
 */
export type TASK_RUNNING_STATUS = TaskRunningStatus;

/**
 * 主题样式变体
 */
export type AgentRunBarVariant = 'simple' | 'default';

/**
 * @deprecated 请使用 {@link AgentRunBarVariant}
 */
export type TaskRunningVariant = AgentRunBarVariant;

/**
 * 任务操作按钮渲染函数
 */
export type AgentRunBarActionsRender = (props: {
  status?: TaskStatus;
  runningStatus?: TaskRunningStatus;
}) => React.ReactNode;

/**
 * @deprecated 请使用 {@link AgentRunBarActionsRender}
 */
export type TaskRunningActionsRender = AgentRunBarActionsRender;

/**
 * AgentRunBar 组件的属性接口
 *
 * @interface AgentRunBarProps
 */
export interface AgentRunBarProps {
  /** 任务状态（宏观/终态），详见 {@link TaskStatus} */
  taskStatus: TaskStatus;
  /** 任务运行状态（过程态），详见 {@link TaskRunningStatus} */
  taskRunningStatus: TaskRunningStatus;
  /** 创建新任务的回调函数 */
  onCreateNewTask?: () => void;
  /** 暂停任务的回调函数 */
  onPause?: () => void;
  /** 继续任务的回调函数 */
  onResume?: () => void;
  /** 停止任务的回调函数 */
  onStop?: () => void;
  /** 重新执行任务的回调函数 */
  onReplay?: () => void;
  /** 查看任务结果的回调函数 */
  onViewResult?: () => void;
  className?: string;
  style?: React.CSSProperties;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 图标提示文案 */
  iconTooltip?: string;
  /** 标题文案 */
  title?: string;
  /** 描述文案 */
  description?: string;
  /** 自定义操作按钮 */
  actionsRender?: AgentRunBarActionsRender | false;
  /** 主题样式变体 */
  variant?: AgentRunBarVariant;
  /** 国际化配置 */
  locale?: {
    agentRunBar?: {
      play?: string;
      pause?: string;
      stop?: string;
      createNewTask?: string;
      replayTask?: string;
      newTask?: string;
      submitTask?: string;
    };
  };
}

/**
 * @deprecated 请使用 {@link AgentRunBarProps}
 */
export type TaskRunningProps = AgentRunBarProps;

/**
 * 渲染按钮组的函数
 * 使用提前返回优化代码可读性
 */
const renderButtonGroup = ({
  taskStatus,
  taskRunningStatus,
  actionsRender,
  baseCls,
  hashId,
  locale,
  onCreateNewTask,
  onReplay,
  onViewResult,
  onPause,
  onResume,
  onStop,
  variant,
}: Pick<
  AgentRunBarProps,
  | 'taskStatus'
  | 'taskRunningStatus'
  | 'onCreateNewTask'
  | 'onPause'
  | 'onResume'
  | 'onStop'
  | 'onReplay'
  | 'onViewResult'
  | 'actionsRender'
  | 'locale'
  | 'variant'
> & {
  baseCls: string;
  hashId: string;
}) => {
  // 任务运行中状态
  const isRunning =
    taskStatus === TASK_STATUS.RUNNING &&
    taskRunningStatus === TASK_RUNNING_STATUS.RUNNING;

  // 任务已暂停状态
  const isPause =
    taskStatus === TASK_STATUS.PAUSE ||
    (taskStatus === TASK_STATUS.RUNNING &&
      taskRunningStatus === TASK_RUNNING_STATUS.PAUSE);

  // 处理自定义操作按钮（提前返回）
  if (actionsRender !== undefined) {
    const actionNode =
      typeof actionsRender === 'function'
        ? actionsRender({
            status: taskStatus,
            runningStatus: taskRunningStatus,
          })
        : actionsRender;

    return (
      <div className={classNames(`${baseCls}-button-wrapper`, hashId)}>
        {actionNode}
        {/* 控制按钮（停止、暂停、继续） */}
        {(isRunning || isPause) && onStop && (
          <Tooltip mouseEnterDelay={0.3} title={locale?.agentRunBar?.stop}>
            <div
              className={classNames(`${baseCls}-pause`, hashId)}
              role="button"
              tabIndex={0}
              aria-label={locale?.agentRunBar?.stop}
              onClick={onStop}
            >
              {variant === 'simple' ? <SimpleStopIcon /> : <StopIcon />}
            </div>
          </Tooltip>
        )}
        {isRunning && onPause && (
          <Tooltip title={locale?.agentRunBar?.pause} mouseEnterDelay={0.3}>
            <div
              className={classNames(`${baseCls}-pause`, hashId)}
              role="button"
              tabIndex={0}
              aria-label={locale?.agentRunBar?.pause}
              onClick={onPause}
            >
              {variant === 'simple' ? <SimplePauseIcon /> : <PauseIcon />}
            </div>
          </Tooltip>
        )}
        {isPause && onResume && (
          <Tooltip title={locale?.agentRunBar?.play} mouseEnterDelay={0.3}>
            <div
              className={classNames(`${baseCls}-play`, hashId)}
              role="button"
              tabIndex={0}
              aria-label={locale?.agentRunBar?.play}
              onClick={onResume}
            >
              {variant === 'simple' ? <SimplePlayIcon /> : <PlayIcon />}
            </div>
          </Tooltip>
        )}
      </div>
    );
  }

  // 根据任务状态渲染不同的操作按钮
  let actionNode: React.ReactNode = null;

  // 任务已暂停状态
  if (isPause) {
    if (onCreateNewTask) {
      actionNode = (
        <Button
          onClick={onCreateNewTask}
          icon={<PlusOutlined />}
          color="default"
          variant="solid"
        >
          {locale?.agentRunBar?.newTask}
        </Button>
      );
    }
  }
  // 任务已停止状态
  else if (
    taskStatus === TASK_STATUS.STOPPED ||
    taskStatus === TASK_STATUS.CANCELLED
  ) {
    actionNode = (
      <>
        {onViewResult && (
          <Button
            onClick={onViewResult}
            color="default"
            variant="solid"
            autoInsertSpace={false}
          >
            {locale?.agentRunBar?.submitTask}
          </Button>
        )}
        {onCreateNewTask && (
          <Button
            type="primary"
            onClick={onCreateNewTask}
            icon={<PlusOutlined />}
            color="default"
            variant="solid"
          >
            {locale?.agentRunBar?.createNewTask}
          </Button>
        )}
      </>
    );
  }
  // 任务已完成状态
  else if (
    taskStatus === TASK_STATUS.SUCCESS &&
    taskRunningStatus === TASK_RUNNING_STATUS.COMPLETE
  ) {
    actionNode = (
      <>
        {onReplay && (
          <Button onClick={onReplay} variant="solid" autoInsertSpace={false}>
            {locale?.agentRunBar?.replayTask}
          </Button>
        )}
        {onViewResult && (
          <Button
            onClick={onViewResult}
            color="default"
            variant="solid"
            autoInsertSpace={false}
          >
            {locale?.agentRunBar?.submitTask}
          </Button>
        )}
        {onCreateNewTask && (
          <Button
            onClick={onCreateNewTask}
            icon={<PlusOutlined />}
            color="default"
            variant="solid"
          >
            {locale?.agentRunBar?.newTask}
          </Button>
        )}
      </>
    );
  }
  // 任务出错状态
  else if (taskStatus === TASK_STATUS.ERROR) {
    actionNode = (
      <>
        {onReplay && (
          <Button onClick={onReplay} variant="solid" autoInsertSpace={false}>
            {locale?.agentRunBar?.replayTask}
          </Button>
        )}
        {onViewResult && (
          <Button
            onClick={onViewResult}
            color="default"
            variant="solid"
            autoInsertSpace={false}
          >
            {locale?.agentRunBar?.submitTask}
          </Button>
        )}
        {onCreateNewTask && (
          <Button
            onClick={onCreateNewTask}
            icon={<PlusOutlined />}
            color="default"
            variant="solid"
          >
            {locale?.agentRunBar?.newTask}
          </Button>
        )}
      </>
    );
  }
  // 默认状态（非运行中且非暂停）
  else if (!isRunning && !isPause) {
    if (onCreateNewTask) {
      actionNode = (
        <Button
          onClick={onCreateNewTask}
          icon={<PlusOutlined />}
          color="default"
          variant="solid"
        >
          {locale?.agentRunBar?.createNewTask}
        </Button>
      );
    }
  }

  const stopTitle = locale?.agentRunBar?.stop;
  const pauseTitle = locale?.agentRunBar?.pause;
  const playTitle = locale?.agentRunBar?.play;

  return (
    <div className={classNames(`${baseCls}-button-wrapper`, hashId)}>
      {actionNode}

      {/* 停止按钮 */}
      {(isRunning || isPause) && onStop && (
        <Tooltip mouseEnterDelay={0.3} title={stopTitle}>
          <div
            className={classNames(`${baseCls}-pause`, hashId)}
            role="button"
            tabIndex={0}
            aria-label={stopTitle}
            onClick={onStop}
          >
            {variant === 'simple' ? <SimpleStopIcon /> : <StopIcon />}
          </div>
        </Tooltip>
      )}
      {/* 暂停按钮 */}
      {isRunning && onPause && (
        <Tooltip title={pauseTitle} mouseEnterDelay={0.3}>
          <div
            className={classNames(`${baseCls}-pause`, hashId)}
            role="button"
            tabIndex={0}
            aria-label={pauseTitle}
            onClick={onPause}
          >
            {variant === 'simple' ? <SimplePauseIcon /> : <PauseIcon />}
          </div>
        </Tooltip>
      )}
      {/* 继续按钮 */}
      {isPause && onResume && (
        <Tooltip title={playTitle} mouseEnterDelay={0.3}>
          <div
            className={classNames(`${baseCls}-play`, hashId)}
            role="button"
            tabIndex={0}
            aria-label={playTitle}
            onClick={onResume}
          >
            {variant === 'simple' ? <SimplePlayIcon /> : <PlayIcon />}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

/**
 * AgentRunBar 组件 - 智能体任务运行状态条
 *
 * 该组件以一条横向状态条的形式展示 AI 智能体任务的执行状态，包括运行中 /
 * 已暂停 / 已完成 / 出错等多种状态，并提供对应的操作按钮（暂停、继续、停止、
 * 重试、查看结果、新建任务等）。
 *
 * @component
 * @param {AgentRunBarProps} props - 组件属性
 *
 * @example
 * ```tsx
 * <AgentRunBar
 *   title="正在运行中"
 *   description="任务执行中..."
 *   taskStatus="running"
 *   taskRunningStatus="running"
 *   onPause={() => {}}
 *   onResume={() => {}}
 *   onStop={() => {}}
 *   onReplay={() => {}}
 *   onViewResult={() => {}}
 *   onCreateNewTask={() => {}}
 * />
 * ```
 */
const AgentRunBarComponent: React.FC<AgentRunBarProps> = (rest) => {
  const {
    className,
    taskRunningStatus,
    taskStatus,
    onPause,
    onResume,
    onCreateNewTask,
    onViewResult,
    onReplay,
    onStop,
    title,
    description,
    icon,
    iconTooltip,
    actionsRender,
    variant = 'default',
  } = rest;

  const context = useContext(ConfigProvider.ConfigContext);
  const baseCls = context?.getPrefixCls('agent-run-bar');
  const { wrapSSR, hashId } = useStyle(baseCls);

  // 从context获取国际化配置
  const { locale } = useContext(I18nContext);

  // 获取机器人状态
  const robotStatus = useMemo(() => {
    if (taskRunningStatus === TASK_RUNNING_STATUS.COMPLETE) {
      return 'dazing';
    }
    if (
      taskRunningStatus === TASK_RUNNING_STATUS.PAUSE ||
      taskStatus === TASK_STATUS.PAUSE
    ) {
      return 'pause';
    }
    if (
      taskStatus === TASK_STATUS.SUCCESS ||
      taskStatus === TASK_STATUS.ERROR
    ) {
      return 'default';
    }
    return 'thinking';
  }, [taskRunningStatus, taskStatus]);

  return wrapSSR(
    <motion.div
      className={classNames(
        baseCls,
        hashId,
        className,
        `${baseCls}-${variant}`,
        {
          [`${baseCls}-with-description`]: description,
          [`${baseCls}-status-${robotStatus}`]: robotStatus,
        },
      )}
      data-testid={baseCls}
      layout="size"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={rest.style}
    >
      <div className={classNames(`${baseCls}-border`, hashId)} />
      <div className={classNames(`${baseCls}-background`, hashId)} />
      <div className={classNames(`${baseCls}-left`, hashId)}>
        {icon !== false && (
          <div className={classNames(`${baseCls}-left-icon-wrapper`, hashId)}>
            <Tooltip title={iconTooltip}>
              <Robot icon={icon} status={robotStatus} size={40} />
            </Tooltip>
          </div>
        )}
        {/* 文字区 */}
        <div className={classNames(`${baseCls}-left-content`, hashId)}>
          {title && (
            <Typography.Title
              className={classNames(`${baseCls}-left-main-text`, hashId)}
              ellipsis={{ tooltip: title, rows: description ? 1 : 2 }}
            >
              {title}
            </Typography.Title>
          )}
          {variant !== 'simple' && description && (
            <Typography.Text
              className={classNames(`${baseCls}-left-text`, hashId)}
              ellipsis={{ tooltip: description }}
            >
              {description}
            </Typography.Text>
          )}
        </div>
      </div>

      {/* 按钮区 */}
      {renderButtonGroup({
        taskStatus,
        taskRunningStatus,
        onCreateNewTask,
        onPause,
        onResume,
        onStop,
        onReplay,
        onViewResult,
        actionsRender,
        baseCls,
        hashId,
        locale,
        variant,
      })}
    </motion.div>,
  );
};

/**
 * AgentRunBar - 智能体任务运行状态条
 *
 * 使用 React.memo 优化性能，避免不必要的重新渲染。
 */
export const AgentRunBar = memo(AgentRunBarComponent);

/**
 * @deprecated 请使用 {@link AgentRunBar}。该别名保留以兼容旧代码，将在未来版本移除。
 */
export const TaskRunning = AgentRunBar;
