# 测试文件命名治理 dry-run 清单

## 统计

| 项目 | 数量 |
|---|---|
| 扫描总文件数 | 537 |
| 不变（已合规） | 473 |
| 改后缀（→ .branches / .benchmark） | 20 |
| 合并到主文件（.base/.unit/.assertions） | 3 |
| 挪到 scenarios/ 子目录 | 27 |
| 挪到 props/ 子目录 | 9 |
| 挪到 events/ 子目录 | 5 |
| ⚠️ 命名冲突（多个文件改名后撞名） | 8 |
| ⚠️ 待人工 review（未识别后缀） | 0 |
| 受影响 import 引用数 | 0 |

## 改后缀（20）

| 旧路径 | 新路径 | 理由 | 冲突 |
|---|---|---|---|
| `src/Components/__tests__/ActionIconBox.targeted-coverage.test.tsx` | `src/Components/__tests__/ActionIconBox.branches.test.tsx` | .targeted-coverage → .branches |  |
| `src/Components/__tests__/SwitchButton.disabled-coverage.test.tsx` | `src/Components/__tests__/SwitchButton.branches.test.tsx` | .disabled-coverage → .branches |  |
| `src/Hooks/__tests__/useAutoScroll.targeted-coverage.test.tsx` | `src/Hooks/__tests__/useAutoScroll.branches.test.tsx` | .targeted-coverage → .branches |  |
| `src/MarkdownEditor/__tests__/editor/elements.performance.test.tsx` | `src/MarkdownEditor/__tests__/editor/elements.benchmark.test.tsx` | .performance → .benchmark | ⚠️ YES |
| `src/MarkdownEditor/__tests__/editor/elements/Image.targeted-coverage.test.tsx` | `src/MarkdownEditor/__tests__/editor/elements/Image.branches.test.tsx` | .targeted-coverage → .branches |  |
| `src/MarkdownEditor/__tests__/editor/elements/Media.targeted-coverage.test.tsx` | `src/MarkdownEditor/__tests__/editor/elements/Media.branches.test.tsx` | .targeted-coverage → .branches |  |
| `src/MarkdownEditor/__tests__/editor/plugins/useOnchange.targeted-coverage.test.tsx` | `src/MarkdownEditor/__tests__/editor/plugins/useOnchange.branches.test.tsx` | .targeted-coverage → .branches |  |
| `src/MarkdownEditor/__tests__/editor/tools/Leading.targeted-coverage.test.tsx` | `src/MarkdownEditor/__tests__/editor/tools/Leading.branches.test.tsx` | .targeted-coverage → .branches |  |
| `src/MarkdownEditor/__tests__/editor/utils/editorCommands.coverage.test.ts` | `src/MarkdownEditor/__tests__/editor/utils/editorCommands.branches.test.ts` | .coverage → .branches |  |
| `src/MarkdownEditor/editor/parser/__tests__/parserSlateNodeToMarkdown.targeted.test.ts` | `src/MarkdownEditor/editor/parser/__tests__/parserSlateNodeToMarkdown.branches.test.ts` | .targeted → .branches |  |
| `src/MarkdownInputField/__tests__/MarkdownInputField.comprehensive.test.tsx` | `src/MarkdownInputField/__tests__/MarkdownInputField.branches.test.tsx` | .comprehensive → .branches | ⚠️ YES |
| `src/MarkdownInputField/__tests__/MarkdownInputField.enhanced.test.tsx` | `src/MarkdownInputField/__tests__/MarkdownInputField.branches.test.tsx` | .enhanced → .branches | ⚠️ YES |
| `src/MarkdownInputField/__tests__/MarkdownInputField.targeted-coverage.test.tsx` | `src/MarkdownInputField/__tests__/MarkdownInputField.branches.test.tsx` | .targeted-coverage → .branches | ⚠️ YES |
| `src/Plugins/chart/__tests__/AreaChart.coverage.test.tsx` | `src/Plugins/chart/__tests__/AreaChart.branches.test.tsx` | .coverage → .branches |  |
| `src/Plugins/chart/__tests__/BarChart.coverage.test.tsx` | `src/Plugins/chart/__tests__/BarChart.branches.test.tsx` | .coverage → .branches | ⚠️ YES |
| `src/Plugins/code/__tests__/components/AceEditor.coverage.test.tsx` | `src/Plugins/code/__tests__/components/AceEditor.branches.test.tsx` | .coverage → .branches |  |
| `src/Schema/SchemaRenderer/__tests__/SchemaRenderer.comprehensive.test.tsx` | `src/Schema/SchemaRenderer/__tests__/SchemaRenderer.branches.test.tsx` | .comprehensive → .branches | ⚠️ YES |
| `src/Schema/SchemaRenderer/__tests__/SchemaRenderer.targeted-coverage.test.tsx` | `src/Schema/SchemaRenderer/__tests__/SchemaRenderer.branches.test.tsx` | .targeted-coverage → .branches | ⚠️ YES |
| `src/Schema/__tests__/validator.enhanced.test.ts` | `src/Schema/__tests__/validator.branches.test.ts` | .enhanced → .branches |  |
| `src/TaskList/__tests__/TaskList.enhanced.test.tsx` | `src/TaskList/__tests__/TaskList.branches.test.tsx` | .enhanced → .branches |  |

## 合并到主文件（3）

| 旧路径 | 新路径 | 理由 | 冲突 |
|---|---|---|---|
| `src/MarkdownEditor/editor/__tests__/EditorStore.unit.test.ts` | `src/MarkdownEditor/editor/__tests__/EditorStore.test.ts` | .unit 合并到主文件 |  |
| `src/MarkdownEditor/editor/parser/__tests__/parserSlateNodeToMarkdown.base.test.ts` | `src/MarkdownEditor/editor/parser/__tests__/parserSlateNodeToMarkdown.test.ts` | .base 合并到主文件 |  |
| `src/MarkdownInputField/__tests__/MarkdownInputField.assertions.test.tsx` | `src/MarkdownInputField/__tests__/MarkdownInputField.test.tsx` | .assertions 合并到主文件 | ⚠️ YES |

## 挪到 scenarios/（27）

| 旧路径 | 新路径 | 理由 | 冲突 |
|---|---|---|---|
| `src/Bubble/__tests__/BubbleExtra.shouldShowCopy-onCancelLike.test.tsx` | `src/Bubble/__tests__/scenarios/BubbleExtra.shouldShowCopy-onCancelLike.test.tsx` | 子场景 .shouldShowCopy-onCancelLike |  |
| `src/Bubble/__tests__/BubbleExtra.voice.test.tsx` | `src/Bubble/__tests__/scenarios/BubbleExtra.voice.test.tsx` | 子场景 .voice |  |
| `src/Hooks/__tests__/useStyle.fallback.test.tsx` | `src/Hooks/__tests__/scenarios/useStyle.fallback.test.tsx` | 子场景 .fallback |  |
| `src/MarkdownEditor/__tests__/BaseMarkdownEditor.apaasify.test.tsx` | `src/MarkdownEditor/__tests__/scenarios/BaseMarkdownEditor.apaasify.test.tsx` | 子场景 .apaasify |  |
| `src/MarkdownEditor/__tests__/editor/Editor.align.test.tsx` | `src/MarkdownEditor/__tests__/editor/scenarios/Editor.align.test.tsx` | 子场景 .align |  |
| `src/MarkdownEditor/__tests__/editor/Editor.card.test.tsx` | `src/MarkdownEditor/__tests__/editor/scenarios/Editor.card.test.tsx` | 子场景 .card |  |
| `src/MarkdownEditor/__tests__/editor/Editor.card.visual.test.tsx` | `src/MarkdownEditor/__tests__/editor/scenarios/Editor.card.visual.test.tsx` | 子场景 .visual |  |
| `src/MarkdownEditor/__tests__/editor/elements/Schema.bubble.test.tsx` | `src/MarkdownEditor/__tests__/editor/elements/scenarios/Schema.bubble.test.tsx` | 子场景 .bubble |  |
| `src/MarkdownEditor/__tests__/editor/elements/Schema.bubblecontext.test.tsx` | `src/MarkdownEditor/__tests__/editor/elements/scenarios/Schema.bubblecontext.test.tsx` | 子场景 .bubblecontext |  |
| `src/MarkdownEditor/__tests__/editor/utils/keyboard.list.test.tsx` | `src/MarkdownEditor/__tests__/editor/utils/scenarios/keyboard.list.test.tsx` | 子场景 .list |  |
| `src/MarkdownEditor/__tests__/editor/withMarkdown.console.test.tsx` | `src/MarkdownEditor/__tests__/editor/scenarios/withMarkdown.console.test.tsx` | 子场景 .console |  |
| `src/MarkdownEditor/__tests__/markdownToHtml.safe.test.tsx` | `src/MarkdownEditor/__tests__/scenarios/markdownToHtml.safe.test.tsx` | 子场景 .safe |  |
| `src/MarkdownEditor/editor/__tests__/Editor.error-boundary.test.tsx` | `src/MarkdownEditor/editor/__tests__/scenarios/Editor.error-boundary.test.tsx` | 子场景 .error-boundary |  |
| `src/MarkdownEditor/editor/__tests__/Editor.handlers.test.tsx` | `src/MarkdownEditor/editor/__tests__/scenarios/Editor.handlers.test.tsx` | 子场景 .handlers |  |
| `src/MarkdownEditor/editor/parser/__tests__/parserSlateNodeToMarkdown.table.test.ts` | `src/MarkdownEditor/editor/parser/__tests__/scenarios/parserSlateNodeToMarkdown.table.test.ts` | 子场景 .table |  |
| `src/MarkdownEditor/editor/plugins/__tests__/useHighlight.jinja.test.ts` | `src/MarkdownEditor/editor/plugins/__tests__/scenarios/useHighlight.jinja.test.ts` | 子场景 .jinja |  |
| `src/MarkdownEditor/editor/plugins/hotKeyCommands/__tests__/backspace.markdown.test.ts` | `src/MarkdownEditor/editor/plugins/hotKeyCommands/__tests__/scenarios/backspace.markdown.test.ts` | 子场景 .markdown |  |
| `src/MarkdownEditor/editor/plugins/hotKeyCommands/__tests__/enter.markdown.test.ts` | `src/MarkdownEditor/editor/plugins/hotKeyCommands/__tests__/scenarios/enter.markdown.test.ts` | 子场景 .markdown |  |
| `src/MarkdownInputField/__tests__/MarkdownInputField.keyboard.test.tsx` | `src/MarkdownInputField/__tests__/scenarios/MarkdownInputField.keyboard.test.tsx` | 子场景 .keyboard |  |
| `src/MarkdownInputField/__tests__/MarkdownInputField.sendButton.test.tsx` | `src/MarkdownInputField/__tests__/scenarios/MarkdownInputField.sendButton.test.tsx` | 子场景 .sendButton |  |
| `src/MarkdownRenderer/__tests__/useMarkdownToReact.streaming-chart-card-stability.test.tsx` | `src/MarkdownRenderer/__tests__/scenarios/useMarkdownToReact.streaming-chart-card-stability.test.tsx` | 子场景 .streaming-chart-card-stability |  |
| `src/MarkdownRenderer/__tests__/useMarkdownToReact.streaming-stability.test.tsx` | `src/MarkdownRenderer/__tests__/scenarios/useMarkdownToReact.streaming-stability.test.tsx` | 子场景 .streaming-stability |  |
| `src/MarkdownRenderer/__tests__/useStreamingMarkdown.revision.test.tsx` | `src/MarkdownRenderer/__tests__/scenarios/useStreamingMarkdown.revision.test.tsx` | 子场景 .revision |  |
| `src/MarkdownRenderer/__tests__/useStreamingMarkdownReact.cache.test.tsx` | `src/MarkdownRenderer/__tests__/scenarios/useStreamingMarkdownReact.cache.test.tsx` | 子场景 .cache |  |
| `src/Plugins/chart/__tests__/utils/resolveCssVariable.dom.test.ts` | `src/Plugins/chart/__tests__/utils/scenarios/resolveCssVariable.dom.test.ts` | 子场景 .dom |  |
| `src/Plugins/code/__tests__/components/AceEditor.theme.test.tsx` | `src/Plugins/code/__tests__/components/scenarios/AceEditor.theme.test.tsx` | 子场景 .theme |  |
| `src/Schema/SchemaRenderer/__tests__/SchemaRenderer.fallback.test.tsx` | `src/Schema/SchemaRenderer/__tests__/scenarios/SchemaRenderer.fallback.test.tsx` | 子场景 .fallback |  |

## 挪到 props/（9）

| 旧路径 | 新路径 | 理由 | 冲突 |
|---|---|---|---|
| `src/Bubble/__tests__/List/PureBubbleList.originDataFlags.test.tsx` | `src/Bubble/__tests__/List/props/PureBubbleList.originDataFlags.test.tsx` | 属性测试 .originDataFlags |  |
| `src/Bubble/__tests__/MessagesContent.extraRender.test.tsx` | `src/Bubble/__tests__/props/MessagesContent.extraRender.test.tsx` | 属性测试 .extraRender |  |
| `src/Components/VisualList/__tests__/VisualList.defaultIcon.test.tsx` | `src/Components/VisualList/__tests__/props/VisualList.defaultIcon.test.tsx` | 属性测试 .defaultIcon |  |
| `src/MarkdownEditor/__tests__/BaseMarkdownEditor.contentStyle.test.tsx` | `src/MarkdownEditor/__tests__/props/BaseMarkdownEditor.contentStyle.test.tsx` | 属性测试 .contentStyle |  |
| `src/MarkdownEditor/__tests__/BaseMarkdownEditor.renderMode.test.tsx` | `src/MarkdownEditor/__tests__/props/BaseMarkdownEditor.renderMode.test.tsx` | 属性测试 .renderMode |  |
| `src/MarkdownInputField/__tests__/MarkdownInputField.actionsRender.test.tsx` | `src/MarkdownInputField/__tests__/props/MarkdownInputField.actionsRender.test.tsx` | 属性测试 .actionsRender |  |
| `src/MarkdownInputField/__tests__/MarkdownInputField.leafRender.test.tsx` | `src/MarkdownInputField/__tests__/props/MarkdownInputField.leafRender.test.tsx` | 属性测试 .leafRender |  |
| `src/Plugins/chart/__tests__/BarChart.maxBarThickness.test.tsx` | `src/Plugins/chart/__tests__/props/BarChart.maxBarThickness.test.tsx` | 属性测试 .maxBarThickness |  |
| `src/ToolUseBar/__tests__/ToolUseBar.expandedKeys.test.tsx` | `src/ToolUseBar/__tests__/props/ToolUseBar.expandedKeys.test.tsx` | 属性测试 .expandedKeys |  |

## 挪到 events/（5）

| 旧路径 | 新路径 | 理由 | 冲突 |
|---|---|---|---|
| `src/MarkdownEditor/__tests__/editor/Editor.onPaste.test.tsx` | `src/MarkdownEditor/__tests__/editor/events/Editor.onPaste.test.tsx` | 事件测试 .onPaste |  |
| `src/MarkdownEditor/__tests__/editor/debug.deleteBackward.test.tsx` | `src/MarkdownEditor/__tests__/editor/events/debug.deleteBackward.test.tsx` | 事件测试 .deleteBackward |  |
| `src/MarkdownEditor/__tests__/editor/withMarkdown.deleteBackward.test.tsx` | `src/MarkdownEditor/__tests__/editor/events/withMarkdown.deleteBackward.test.tsx` | 事件测试 .deleteBackward |  |
| `src/MarkdownInputField/__tests__/MarkdownInputField.onSend.test.tsx` | `src/MarkdownInputField/__tests__/events/MarkdownInputField.onSend.test.tsx` | 事件测试 .onSend |  |
| `src/Workspace/__tests__/RealtimeFollow/RealtimeFollow.onViewModeChange.test.tsx` | `src/Workspace/__tests__/RealtimeFollow/events/RealtimeFollow.onViewModeChange.test.tsx` | 事件测试 .onViewModeChange |  |
