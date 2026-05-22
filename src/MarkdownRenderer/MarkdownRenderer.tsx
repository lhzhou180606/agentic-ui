import { ConfigProvider } from 'antd';
import clsx from 'clsx';
import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type { MarkdownEditorPlugin } from '../MarkdownEditor/plugin';
import { useStyle as useEditorStyle } from '../MarkdownEditor/style';
import { DefaultCodeRouter } from './DefaultCodeRouter';
import { extractFootnoteDefinitionsFromMarkdown } from './extractFootnoteDefinitions';
import type {
  MarkdownRendererProps,
  MarkdownRendererRef,
  RendererBlockProps,
} from './types';
import { useMarkdownToReact } from './useMarkdownToReact';
import { useStreaming } from './useStreaming';

/**
 * 从插件列表中收集 rendererComponents
 */
const collectRendererComponents = (
  plugins?: MarkdownEditorPlugin[],
): Record<string, React.ComponentType<RendererBlockProps>> => {
  const components: Record<
    string,
    React.ComponentType<RendererBlockProps>
  > = {};
  if (!plugins) return components;
  for (const plugin of plugins) {
    const renderer = (plugin as any).renderer;
    if (renderer?.rendererComponents) {
      Object.assign(components, renderer.rendererComponents);
    }
  }
  return components;
};

/** 轻量流式 Markdown 渲染器——无 Slate 实例，Markdown → hast → React */
const InternalMarkdownRenderer = forwardRef<
  MarkdownRendererRef,
  MarkdownRendererProps
>((props, ref) => {
  const {
    content,
    streaming = false,
    plugins,
    remarkPlugins,
    htmlConfig,
    className,
    style,
    prefixCls: customPrefixCls,
    linkConfig,
    apaasify,
    eleRender,
    fileMapConfig,
    fncProps,
    codeProps: editorCodeProps,
  } = props;

  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('agentic-md-editor', customPrefixCls);
  const { hashId } = useEditorStyle(prefixCls);
  const contentCls = `${prefixCls}-content`;

  const containerRef = useRef<HTMLDivElement>(null);
  const text = content || '';

  useImperativeHandle(ref, () => ({
    nativeElement: containerRef.current,
    getDisplayedContent: () => text,
  }));

  const pluginComponents = useMemo(
    () => collectRendererComponents(plugins),
    [plugins],
  );

  const lastFootnoteEmptyRef = useRef(false);
  useEffect(() => {
    const notify = fncProps?.onFootnoteDefinitionChange;
    if (!notify) return;
    if (!/^\[\^[^\]]+\]:/m.test(text)) {
      if (!lastFootnoteEmptyRef.current) {
        notify([]);
        lastFootnoteEmptyRef.current = true;
      }
      return;
    }
    lastFootnoteEmptyRef.current = false;
    notify(extractFootnoteDefinitionsFromMarkdown(text));
  }, [text, fncProps?.onFootnoteDefinitionChange]);

  const apaasifyRender = useMemo(() => {
    if (apaasify?.enable && apaasify.render) return apaasify.render;
    return undefined;
  }, [apaasify]);

  const components = useMemo(() => {
    const codeRouter = (blockProps: RendererBlockProps) => (
      <DefaultCodeRouter
        {...blockProps}
        pluginComponents={pluginComponents}
        apaasifyRender={apaasifyRender}
        fileMapConfig={fileMapConfig}
        editorCodeProps={editorCodeProps}
      />
    );
    codeRouter.displayName = 'CodeRouter';

    return {
      __codeBlock: codeRouter,
      ...pluginComponents,
    };
  }, [pluginComponents, apaasifyRender, fileMapConfig, editorCodeProps]);

  const safeContent = useStreaming(text, streaming);

  const reactContent = useMarkdownToReact(safeContent, {
    remarkPlugins,
    htmlConfig,
    components,
    prefixCls,
    linkConfig,
    fncProps,
    streaming,
    contentRevisionSource: streaming ? text : undefined,
    eleRender,
  });

  return (
    <div
      ref={containerRef}
      className={clsx(
        prefixCls,
        `${prefixCls}-readonly`,
        hashId,
        className,
      )}
      data-testid="markdown-renderer"
      style={style}
    >
      <div
        className={clsx(`${prefixCls}-container`, hashId)}
        style={{ display: 'block' }}
      >
        <div
          className={clsx(
            contentCls,
            `${contentCls}-markdown-readonly`,
            hashId,
          )}
          style={{ whiteSpace: 'normal', wordWrap: 'normal' }}
        >
          {reactContent}
        </div>
      </div>
    </div>
  );
});

InternalMarkdownRenderer.displayName = 'MarkdownRenderer';

export default InternalMarkdownRenderer;
