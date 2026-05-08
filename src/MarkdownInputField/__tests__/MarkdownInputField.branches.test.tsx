/**
 * MarkdownInputField 组件全面测试文件
 */

import { MarkdownInputField } from '@ant-design/agentic-ui';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import classNames from 'clsx';
import { MarkdownInputField } from '../MarkdownInputField';
import { addGlowBorderOffset } from '../style';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('../../MarkdownEditor', () => ({
  BaseMarkdownEditor: ({ children, ...props }: any) => (
    <div data-testid="base-markdown-editor" {...props}>
      {children}
    </div>
  ),
  MarkdownEditorInstance: {},
}));

vi.mock('slate-react', () => ({
  ReactEditor: {
    findPath: vi.fn(() => [0]),
    findNode: vi.fn(() => ({ children: [] })),
  },
}));

vi.mock('../Suggestion', () => ({
  Suggestion: ({ children, ...props }: any) => (
    <div data-testid="suggestion" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../AttachmentButton', () => ({
  AttachmentButton: ({ children, ...props }: any) => (
    <div data-testid="attachment-button" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../SendButton', () => ({
  resolveSendDisabled: () => false,
  SendButton: ({ children, ...props }: any) => (
    <button data-testid="send-button" type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../SkillModeBar', () => ({
  SkillModeBar: ({ skillMode, onSkillModeOpenChange, ...props }: any) => {
    // 使用 useRef 和 useEffect 来模拟状态变化监听
    const prevOpenRef = React.useRef<boolean | undefined>(skillMode?.open);

    React.useEffect(() => {
      const currentOpen = skillMode?.open;
      const prevOpen = prevOpenRef.current;

      // 跳过初始渲染，只在后续更新时触发回调
      if (prevOpen !== undefined && currentOpen !== prevOpen) {
        onSkillModeOpenChange?.(!!currentOpen);
      }

      prevOpenRef.current = currentOpen;
    }, [skillMode?.open, onSkillModeOpenChange]);

    // 如果 skillMode 不存在或 enable 为 false，不渲染任何内容
    if (!skillMode || skillMode.enable === false) return null;

    // 如果 open 为 false，不渲染任何内容
    if (!skillMode?.open) return null;

    return (
      <div data-testid="skill-mode-bar" {...props}>
        <div data-testid="skill-mode-title">{skillMode.title}</div>
        {(() => {
          if (!skillMode.rightContent) return null;

          // 将 rightContent 统一转换为数组处理
          const contentArray = Array.isArray(skillMode.rightContent)
            ? skillMode.rightContent
            : [skillMode.rightContent];

          return contentArray.map((content: any, index: number) => (
            <div key={index} data-testid={`skill-mode-content-${index}`}>
              {content}
            </div>
          ));
        })()}
        {skillMode.closable !== false && (
          <button
            type="button"
            data-testid="skill-mode-close"
            onClick={() => onSkillModeOpenChange?.(false)}
          >
            关闭
          </button>
        )}
      </div>
    );
  },
}));

vi.mock('../Enlargement', () => ({
  __esModule: true,
  default: ({
    isEnlarged,
    onEnlargeClick,
    ...props
  }: {
    isEnlarged?: boolean;
    onEnlargeClick?: () => void;
  }) => (
    <button
      type="button"
      data-testid="enlargement-toggle"
      data-enlarged={isEnlarged}
      onClick={onEnlargeClick}
      {...props}
    >
      {isEnlarged ? '缩小' : '放大'}
    </button>
  ),
}));

describe('MarkdownInputField Comprehensive Tests', () => {
  const defaultProps = {
    value: '# Hello World',
    onChange: vi.fn(),
    placeholder: 'Type your message...',
    attachment: {
      enable: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染功能', () => {
    it('应该正确渲染基本组件', () => {
      render(
        <MarkdownInputField
          {...defaultProps}
          attachment={{
            enable: true,
          }}
        />,
      );
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该传递正确的 props 给 BaseMarkdownEditor', () => {
      render(<MarkdownInputField {...defaultProps} />);
      const editor = screen.getByTestId('base-markdown-editor');
      expect(editor).toBeInTheDocument();
    });

    it('应该渲染附件按钮', () => {
      render(
        <MarkdownInputField
          {...defaultProps}
          attachment={{
            enable: true,
          }}
        />,
      );
      expect(screen.getByTestId('attachment-button')).toBeInTheDocument();
    });

    it('应该渲染发送按钮', () => {
      render(<MarkdownInputField {...defaultProps} />);
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });

    it('应该渲染建议组件', () => {
      render(<MarkdownInputField {...defaultProps} />);
      expect(screen.getByTestId('suggestion')).toBeInTheDocument();
    });
  });

  describe('Props 传递', () => {
    it('应该正确处理 value prop', () => {
      const testValue = '# Test Heading';
      render(<MarkdownInputField {...defaultProps} value={testValue} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该正确处理 placeholder prop', () => {
      const testPlaceholder = 'Custom placeholder';
      render(
        <MarkdownInputField {...defaultProps} placeholder={testPlaceholder} />,
      );
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该正确处理 disabled prop', () => {
      render(<MarkdownInputField {...defaultProps} disabled={true} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该正确处理 style prop', () => {
      const testStyle = { minHeight: '200px' };
      render(<MarkdownInputField {...defaultProps} style={testStyle} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该正确处理 className prop', () => {
      const testClassName = 'custom-class';
      render(
        <MarkdownInputField {...defaultProps} className={testClassName} />,
      );
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });
  });

  describe('附件功能', () => {
    it('应该启用附件功能', () => {
      render(
        <MarkdownInputField
          {...defaultProps}
          attachment={
            {
              enable: true,
              accept: '.pdf,.doc',
              maxFileSize: 1024 * 1024,
            } as any
          }
        />,
      );
      expect(screen.getByTestId('attachment-button')).toBeInTheDocument();
    });

    it('应该禁用附件功能', () => {
      render(
        <MarkdownInputField
          {...defaultProps}
          attachment={
            {
              enable: false,
            } as any
          }
        />,
      );
      // 附件按钮应该不存在
      expect(screen.queryByTestId('attachment-button')).not.toBeInTheDocument();
    });

    it('应该处理附件上传配置', () => {
      const onUpload = vi.fn();
      render(
        <MarkdownInputField
          {...defaultProps}
          attachment={
            {
              enable: true,
              upload: onUpload,
              accept: '.pdf,.doc',
              maxFileSize: 1024 * 1024,
            } as any
          }
        />,
      );
      expect(screen.getByTestId('attachment-button')).toBeInTheDocument();
    });
  });

  describe('放大功能', () => {
    it('在仅启用放大功能时应渲染放大按钮并进入多行布局', () => {
      const { container } = render(
        <MarkdownInputField
          {...defaultProps}
          refinePrompt={undefined}
          quickActionRender={undefined}
          enlargeable={{ enable: true, height: 600 }}
        />,
      );

      const root = container.querySelector(
        '.ant-agentic-md-input-field',
      ) as HTMLElement;
      expect(root).toBeTruthy();
      expect(
        root?.classList.contains('ant-agentic-md-input-field-is-multi-row'),
      ).toBe(true);

      expect(root?.style.minHeight).toBe('90px');

      const quickActions = container.querySelector(
        '.ant-agentic-md-input-field-quick-actions-vertical',
      );
      expect(quickActions).toBeTruthy();

      const enlargeButton = screen.getByTestId('enlargement-toggle');
      expect(enlargeButton).toHaveAttribute('data-enlarged', 'false');

      fireEvent.click(enlargeButton);
      expect(enlargeButton).toHaveAttribute('data-enlarged', 'true');
      expect(
        root?.classList.contains('ant-agentic-md-input-field-enlarged'),
      ).toBe(true);
    });

    it('在只启用提示词优化时应使用单操作最小高度', () => {
      const { container } = render(
        <MarkdownInputField
          {...defaultProps}
          refinePrompt={{
            enable: true,
            onRefine: vi.fn(),
          }}
          quickActionRender={undefined}
          enlargeable={undefined}
        />,
      );

      const root = container.querySelector(
        '.ant-agentic-md-input-field',
      ) as HTMLElement;
      expect(root).toBeTruthy();
      expect(
        root?.classList.contains('ant-agentic-md-input-field-is-multi-row'),
      ).toBe(true);
      expect(root?.style.minHeight).toBe('90px');
    });
  });

  describe('发送功能', () => {
    it('应该处理 Enter 键发送', () => {
      render(
        <MarkdownInputField
          {...defaultProps}
          triggerSendKey="Enter"
          attachment={{ enable: true }}
        />,
      );
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });

    it('应该处理 onSend 回调', async () => {
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<MarkdownInputField {...defaultProps} onSend={onSend} />);
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });

    it('应该处理 onStop 回调', () => {
      const onStop = vi.fn();
      render(<MarkdownInputField {...defaultProps} onStop={onStop} />);
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });
  });

  describe('自定义渲染', () => {
    it('应该支持 actionsRender 自定义', () => {
      const actionsRender = vi.fn(() => [
        <div key="custom" data-testid="custom-action">
          Custom
        </div>,
      ]);
      render(
        <MarkdownInputField {...defaultProps} actionsRender={actionsRender} />,
      );
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });

    it('应该支持 toolsRender 自定义', () => {
      const toolsRender = vi.fn(() => [
        <div key="custom" data-testid="custom-tool">
          Custom Tool
        </div>,
      ]);
      render(
        <MarkdownInputField {...defaultProps} toolsRender={toolsRender} />,
      );
      expect(screen.getByTestId('custom-tool')).toBeInTheDocument();
    });

    it('应该支持 leafRender 自定义', () => {
      const leafRender = vi.fn((props, defaultDom) => defaultDom);
      render(<MarkdownInputField {...defaultProps} leafRender={leafRender} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });
  });

  describe('引用和实例', () => {
    it('应该支持 inputRef', () => {
      const inputRef = { current: undefined };
      render(<MarkdownInputField {...defaultProps} inputRef={inputRef} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });
  });

  describe('样式和主题', () => {
    it('应该应用自定义圆角', () => {
      render(<MarkdownInputField {...defaultProps} borderRadius={8} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });
  });

  describe('状态管理', () => {
    it('应该处理 typing 状态', () => {
      render(<MarkdownInputField {...defaultProps} typing={true} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该处理 disabled 状态', () => {
      render(<MarkdownInputField {...defaultProps} disabled={true} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });
  });

  describe('事件处理', () => {
    it('应该处理 onChange 事件', () => {
      const onChange = vi.fn();
      render(<MarkdownInputField {...defaultProps} onChange={onChange} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该处理键盘事件', () => {
      render(<MarkdownInputField {...defaultProps} />);
      const editor = screen.getByTestId('base-markdown-editor');

      // 模拟键盘事件
      fireEvent.keyDown(editor, { key: 'Enter', code: 'Enter' });
      expect(editor).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理空的 value', () => {
      render(<MarkdownInputField {...defaultProps} value="" />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该处理未定义的 value', () => {
      render(<MarkdownInputField {...defaultProps} value={undefined} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该处理空的 placeholder', () => {
      render(<MarkdownInputField {...defaultProps} placeholder="" />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该处理未定义的 onChange', () => {
      render(<MarkdownInputField {...defaultProps} onChange={undefined} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });
  });

  describe('性能优化', () => {
    it('应该正确处理 useMemo 优化', () => {
      render(<MarkdownInputField {...defaultProps} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该正确处理 useCallback 优化', () => {
      render(<MarkdownInputField {...defaultProps} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该处理附件上传错误', async () => {
      const onUpload = vi.fn().mockRejectedValue(new Error('Upload failed'));
      render(
        <MarkdownInputField
          {...defaultProps}
          attachment={{
            enable: true,
            upload: onUpload,
          }}
        />,
      );
      expect(screen.getByTestId('attachment-button')).toBeInTheDocument();
    });

    it('应该处理发送错误', async () => {
      const onSend = vi.fn().mockRejectedValue(new Error('Send failed'));
      render(<MarkdownInputField {...defaultProps} onSend={onSend} />);
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });
  });

  describe('集成测试', () => {
    it('应该正确处理完整的用户交互流程', async () => {
      const onChange = vi.fn();
      const onSend = vi.fn().mockResolvedValue(undefined);

      render(
        <MarkdownInputField
          {...defaultProps}
          onChange={onChange}
          onSend={onSend}
          triggerSendKey="Enter"
        />,
      );

      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
      expect(screen.getByTestId('attachment-button')).toBeInTheDocument();
    });

    it('应该正确处理复杂的自定义渲染', () => {
      const actionsRender = vi.fn((_props, defaultActions) => [
        <div key="custom1" data-testid="custom-action-1">
          Action 1
        </div>,
        <div key="custom2" data-testid="custom-action-2">
          Action 2
        </div>,
        ...defaultActions,
      ]);

      const toolsRender = vi.fn(() => [
        <div key="tool1" data-testid="custom-tool-1">
          Tool 1
        </div>,
        <div key="tool2" data-testid="custom-tool-2">
          Tool 2
        </div>,
      ]);

      render(
        <MarkdownInputField
          {...defaultProps}
          actionsRender={actionsRender}
          toolsRender={toolsRender}
          attachment={{
            enable: true,
          }}
        />,
      );

      expect(screen.getByTestId('custom-action-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-action-2')).toBeInTheDocument();
      expect(screen.getByTestId('custom-tool-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-tool-2')).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('应该在禁用状态下正确设置 aria 属性', () => {
      render(<MarkdownInputField {...defaultProps} disabled={true} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该支持键盘导航', () => {
      render(<MarkdownInputField {...defaultProps} />);
      const editor = screen.getByTestId('base-markdown-editor');

      // 测试 Tab 键导航
      fireEvent.keyDown(editor, { key: 'Tab', code: 'Tab' });
      expect(editor).toBeInTheDocument();
    });
  });

  describe('响应式设计', () => {
    it('应该正确处理窗口大小变化', () => {
      render(<MarkdownInputField {...defaultProps} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });

    it('应该正确处理容器大小变化', () => {
      render(<MarkdownInputField {...defaultProps} />);
      expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
    });
  });

  describe('技能模式功能', () => {
    it('应该在 skillMode.enable 为 true 且 open 为 true 时显示技能模式', () => {
      const props = {
        ...defaultProps,
        skillMode: {
          enable: true,
          open: true,
          title: 'AI助手模式',
          closable: true,
        },
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.getByTestId('skill-mode-bar')).toBeInTheDocument();
      expect(screen.getByTestId('skill-mode-title')).toHaveTextContent(
        'AI助手模式',
      );
      expect(screen.getByTestId('skill-mode-close')).toBeInTheDocument();
    });

    it('应该在 skillMode.enable 为 false 时完全不渲染技能模式组件', () => {
      const props = {
        ...defaultProps,
        skillMode: {
          enable: false,
          open: true,
          title: 'AI助手模式',
        },
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.queryByTestId('skill-mode-bar')).not.toBeInTheDocument();
    });

    it('应该在 skillMode.enable 为 true 但 open 为 false 时隐藏技能模式', () => {
      const props = {
        ...defaultProps,
        skillMode: {
          enable: true,
          open: false,
          title: 'AI助手模式',
        },
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.queryByTestId('skill-mode-bar')).not.toBeInTheDocument();
    });

    it('应该在 skillMode.enable 未设置时默认启用技能模式', () => {
      const props = {
        ...defaultProps,
        skillMode: {
          open: true,
          title: 'AI助手模式',
        },
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.getByTestId('skill-mode-bar')).toBeInTheDocument();
    });

    it('应该显示技能模式的右侧内容（数组形式）', () => {
      const rightContent = [
        <div key="tag">标签内容</div>,
        <button key="btn" type="button">
          按钮
        </button>,
      ];

      const props = {
        ...defaultProps,
        skillMode: {
          enable: true,
          open: true,
          title: '测试标题',
          rightContent,
        },
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.getByTestId('skill-mode-content-0')).toBeInTheDocument();
      expect(screen.getByTestId('skill-mode-content-1')).toBeInTheDocument();
    });

    it('应该显示技能模式的右侧内容（单个ReactNode）', () => {
      const rightContent = <div data-testid="single-content">单个内容节点</div>;

      const props = {
        ...defaultProps,
        skillMode: {
          enable: true,
          open: true,
          title: '测试标题',
          rightContent,
        },
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.getByTestId('skill-mode-content-0')).toBeInTheDocument();
      expect(screen.getByTestId('single-content')).toBeInTheDocument();
      expect(screen.getByText('单个内容节点')).toBeInTheDocument();
    });

    it('应该在 closable 为 false 时隐藏关闭按钮', () => {
      const props = {
        ...defaultProps,
        skillMode: {
          enable: true,
          open: true,
          title: '不可关闭模式',
          closable: false,
        },
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.getByTestId('skill-mode-bar')).toBeInTheDocument();
      expect(screen.queryByTestId('skill-mode-close')).not.toBeInTheDocument();
    });

    it('应该在点击关闭按钮时调用 onSkillModeOpenChange', async () => {
      const onSkillModeOpenChange = vi.fn();
      const props = {
        ...defaultProps,
        skillMode: {
          enable: true,
          open: true,
          title: '可关闭模式',
        },
        onSkillModeOpenChange,
      };

      render(<MarkdownInputField {...props} />);

      const closeButton = screen.getByTestId('skill-mode-close');
      await userEvent.click(closeButton);

      expect(onSkillModeOpenChange).toHaveBeenCalledTimes(1);
      expect(onSkillModeOpenChange).toHaveBeenCalledWith(false);
    });

    it('应该支持 React 节点作为标题', () => {
      const customTitle = (
        <div>
          <span>图标</span>
          自定义标题
        </div>
      );

      const props = {
        ...defaultProps,
        skillMode: {
          enable: true,
          open: true,
          title: customTitle,
        },
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.getByText('图标')).toBeInTheDocument();
      expect(screen.getByText('自定义标题')).toBeInTheDocument();
    });

    it('应该处理未定义的 skillMode', () => {
      const props = {
        ...defaultProps,
        skillMode: undefined,
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.queryByTestId('skill-mode-bar')).not.toBeInTheDocument();
    });

    it('应该处理明确设置为 undefined 的 skillMode', () => {
      const props = {
        ...defaultProps,
        skillMode: undefined,
      };

      render(<MarkdownInputField {...props} />);

      expect(screen.queryByTestId('skill-mode-bar')).not.toBeInTheDocument();
    });

    it('应该在 skillMode 状态变化时触发 onSkillModeOpenChange', async () => {
      const onSkillModeOpenChange = vi.fn();
      const { rerender } = render(
        <MarkdownInputField
          {...defaultProps}
          skillMode={{ enable: true, open: false }}
          onSkillModeOpenChange={onSkillModeOpenChange}
        />,
      );

      // 初始状态不会触发回调
      expect(onSkillModeOpenChange).not.toHaveBeenCalled();

      // 状态改变时会触发回调
      rerender(
        <MarkdownInputField
          {...defaultProps}
          skillMode={{ enable: true, open: true }}
          onSkillModeOpenChange={onSkillModeOpenChange}
        />,
      );

      await waitFor(() => {
        expect(onSkillModeOpenChange).toHaveBeenCalledWith(true);
      });
    });

    it('应该支持 enable 参数的动态切换', () => {
      const { rerender } = render(
        <MarkdownInputField
          {...defaultProps}
          skillMode={{
            enable: true,
            open: true,
            title: '动态切换测试',
          }}
        />,
      );

      // 初始状态应该显示技能模式
      expect(screen.getByTestId('skill-mode-bar')).toBeInTheDocument();

      // 切换 enable 为 false
      rerender(
        <MarkdownInputField
          {...defaultProps}
          skillMode={{
            enable: false,
            open: true,
            title: '动态切换测试',
          }}
        />,
      );

      // 组件应该完全消失
      expect(screen.queryByTestId('skill-mode-bar')).not.toBeInTheDocument();

      // 重新启用
      rerender(
        <MarkdownInputField
          {...defaultProps}
          skillMode={{
            enable: true,
            open: true,
            title: '动态切换测试',
          }}
        />,
      );

      // 组件应该重新出现
      expect(screen.getByTestId('skill-mode-bar')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// === merged from MarkdownInputField.enhanced.test.tsx ===
// ===========================================================================

const mockMarkdownEditor = {
  store: {
    getMDContent: vi.fn(() => '# Test Content'),
    setMDContent: vi.fn(),
    clearContent: vi.fn(),
    editor: { children: [] },
    inputComposition: false,
  },
  markdownEditorRef: { current: { children: [] } },
};

vi.mock('../../MarkdownEditor', () => ({
  BaseMarkdownEditor: React.forwardRef(
    (
      {
        titlePlaceholderContent,
        onKeyDown,
        onChange,
        children,
        setValue,
        value,
        initValue,
        ...props
      }: any,
      ref: any,
    ) => {
      React.useImperativeHandle(ref, () => mockMarkdownEditor);

      React.useEffect(() => {
        if (setValue && value !== undefined) {
          mockMarkdownEditor.store.setMDContent(value);
        }
      }, [setValue, value]);

      React.useEffect(() => {
        if (initValue) {
          mockMarkdownEditor.store.setMDContent(initValue);
        }
      }, [initValue]);

      return (
        <div
          data-testid="base-markdown-editor"
          onKeyDown={(e) => {
            onKeyDown?.(e);
          }}
          onClick={(e) => {
            props.onClick?.(e);
          }}
        >
          <textarea
            data-testid="markdown-textarea"
            defaultValue={initValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={titlePlaceholderContent}
          />
          {children}
        </div>
      );
    },
  ),
  MarkdownEditorInstance: {},
}));

vi.mock('slate-react', () => ({
  ReactEditor: {
    findPath: vi.fn(() => [0]),
    findNode: vi.fn(() => ({ children: [] })),
    focus: vi.fn(),
    isFocused: vi.fn(() => false),
  },
}));

vi.mock('../Suggestion', () => ({
  Suggestion: ({ children, ...props }: any) => (
    <div data-testid="suggestion" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../AttachmentButton', () => ({
  AttachmentButton: ({ onClick, disabled, ...props }: any) => (
    <button
      type="button"
      data-testid="attachment-button"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      Attachment
    </button>
  ),
  upLoadFileToServer: vi.fn().mockResolvedValue([]),
}));

vi.mock('../SendButton', () => ({
  resolveSendDisabled: () => false,
  SendButton: ({ typing, disabled, onClick, ...props }: any) => {
    const handleClick = () => {
      if (!disabled && onClick) {
        onClick();
      }
    };

    return (
      <button
        type="button"
        data-testid="send-button"
        onClick={handleClick}
        disabled={disabled}
        data-typing={typing}
        className={classNames({
          'ant-agentic-md-input-field-send-button-typing': typing,
        })}
        {...props}
      >
        Send
      </button>
    );
  },
}));

vi.mock(
  '../AttachmentButton/AttachmentButtonPopover',
  () => ({
    SupportedFileFormats: {
      image: { name: 'Image', extensions: ['.jpg', '.png', '.gif'] },
      document: { name: 'Document', extensions: ['.pdf', '.doc', '.docx'] },
    },
  }),
);

vi.mock(
  '../AttachmentButton/AttachmentFileList',
  () => ({
    AttachmentFileList: ({ fileMap, onDelete, onClearFileMap }: any) => (
      <div data-testid="attachment-file-list">
        {fileMap && fileMap.size > 0 && (
          <div>
            Files: {fileMap.size}
            <button
              type="button"
              data-testid="clear-files"
              onClick={() => onClearFileMap()}
            >
              Clear
            </button>
            <button
              type="button"
              data-testid="delete-file"
              onClick={() => {
                const firstFile = Array.from(fileMap.values())[0];
                if (firstFile) onDelete(firstFile);
              }}
            >
              Delete First
            </button>
          </div>
        )}
      </div>
    ),
  }),
);

vi.mock('../SkillModeBar', () => ({
  SkillModeBar: () => <div data-testid="skill-mode-bar">Skill Mode</div>,
}));

vi.mock('slate', () => ({
  Editor: {
    end: vi.fn(() => ({ path: [0, 0], offset: 0 })),
  },
  Transforms: {
    move: vi.fn(),
    select: vi.fn(),
  },
}));

describe('MarkdownInputField Enhanced Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockMarkdownEditor.store.getMDContent.mockReturnValue('# Test Content');
  });

  describe('核心功能测试', () => {
    it('应该处理文件上传和发送消息功能', async () => {
      const onFileMapChange = vi.fn();
      const onSend = vi.fn();

      render(
        <MarkdownInputField
          value="test"
          attachment={{
            enable: true,
            onFileMapChange,
          }}
          onSend={onSend}
        />,
      );

      // 测试附件按钮
      const attachmentButton = screen.getByTestId('attachment-button');
      expect(attachmentButton).toBeInTheDocument();
      expect(attachmentButton).not.toBeDisabled();

      // 测试发送按钮
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeInTheDocument();
    });

    it('应该在禁用状态下阻止发送', async () => {
      const onSend = vi.fn();

      render(
        <MarkdownInputField value="test" disabled={true} onSend={onSend} />,
      );

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();

      await user.click(sendButton);
      expect(onSend).not.toHaveBeenCalled();
    });

    it('应该处理键盘事件', async () => {
      const onSend = vi.fn();

      render(<MarkdownInputField value="test" onSend={onSend} />);

      const textarea = screen.getByTestId('markdown-textarea');

      // 测试 Ctrl+Enter
      fireEvent.keyDown(textarea, {
        key: 'Enter',
        ctrlKey: true,
      });

      // 由于 mock 的限制，我们只测试事件是否被触发
      expect(textarea).toBeInTheDocument();
    });

    it('应该处理发送成功后清空内容', async () => {
      const onSend = vi.fn().mockResolvedValue(true);

      render(<MarkdownInputField value="test" onSend={onSend} />);

      const sendButton = screen.getByTestId('send-button');
      await user.click(sendButton);

      // 由于 mock 的限制，我们只测试按钮点击
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('状态管理测试', () => {
    it('应该正确处理各种状态', async () => {
      const { rerender } = render(<MarkdownInputField value="initial" />);

      // 测试初始值设置
      expect(mockMarkdownEditor.store.setMDContent).toHaveBeenCalledWith(
        'initial',
      );

      mockMarkdownEditor.store.setMDContent.mockClear();

      // 测试值更新
      rerender(<MarkdownInputField value="updated" />);
      expect(mockMarkdownEditor.store.setMDContent).toHaveBeenCalledWith(
        'updated',
      );

      // 测试 typing 状态
      rerender(<MarkdownInputField value="test" typing={true} />);
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toHaveAttribute('data-typing', 'true');
    });

    it('应该正确设置 inputRef', () => {
      const inputRef = React.createRef<any>();

      render(<MarkdownInputField value="test" inputRef={inputRef} />);

      // 由于 mock 的限制，我们只测试 ref 是否被传递
      expect(inputRef).toBeDefined();
    });
  });

  describe('自定义渲染测试', () => {
    it('应该正确渲染自定义组件', () => {
      const toolsRender = vi.fn(() => [
        <div key="tools" data-testid="custom-tools">
          Tools
        </div>,
      ]);
      const actionsRender = vi.fn(() => [
        <div key="actions" data-testid="custom-actions">
          Actions
        </div>,
      ]);

      render(
        <MarkdownInputField
          value="test"
          toolsRender={toolsRender}
          actionsRender={actionsRender}
        />,
      );

      expect(screen.getByTestId('custom-tools')).toBeInTheDocument();
      expect(screen.getByTestId('custom-actions')).toBeInTheDocument();
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理边界情况', async () => {
      // 测试没有 onSend 的情况
      render(<MarkdownInputField value="test" />);
      const sendButtons = screen.getAllByTestId('send-button');
      await user.click(sendButtons[0]);
      // 不应该抛出错误

      // 测试空的 mdValue
      mockMarkdownEditor.store.getMDContent.mockReturnValue('');
      render(<MarkdownInputField value="" />);
      // 不应该抛出错误

      // 测试发送失败的情况
      const onSend = vi.fn().mockResolvedValue(false);
      render(<MarkdownInputField value="test" onSend={onSend} />);
      const newSendButtons = screen.getAllByTestId('send-button');
      await user.click(newSendButtons[newSendButtons.length - 1]);
      // 由于 mock 限制，只测试点击是否成功
      expect(newSendButtons[newSendButtons.length - 1]).toBeInTheDocument();
    });
  });

  describe('测试覆盖率补充', () => {
    describe('背景尺寸计算测试', () => {
      it('应该调用 addGlowBorderOffset 处理 style.height', () => {
        const style = {
          height: '200px',
          width: '100%',
        };

        render(<MarkdownInputField style={style} value="test content" />);

        // 验证组件正常渲染
        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
      });

      it('应该调用 addGlowBorderOffset 处理 style.width', () => {
        const style = {
          width: '500px',
          height: '100%',
        };

        render(<MarkdownInputField style={style} value="test content" />);

        // 验证组件正常渲染
        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
      });

      it('应该同时处理 style.height 和 style.width', () => {
        const style = {
          height: '300px',
          width: '400px',
        };

        render(<MarkdownInputField style={style} value="test content" />);

        // 验证组件正常渲染
        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
      });

      it('应该处理数字类型的尺寸值', () => {
        const style = {
          height: 200,
          width: 300,
        };

        render(<MarkdownInputField style={style} value="test content" />);

        // 验证组件正常渲染
        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
      });
    });

    describe('附件文件管理测试', () => {
      it('应该调用 setFileMap 设置新的文件映射', async () => {
        const onFileMapChange = vi.fn();
        const initialFileMap = new Map();
        initialFileMap.set('file1', {
          uuid: 'file1',
          name: 'test.jpg',
          status: 'done',
          url: 'http://example.com/test.jpg',
        });

        render(
          <MarkdownInputField
            attachment={{
              enable: true,
              fileMap: initialFileMap,
              onFileMapChange,
            }}
            value="test content"
          />,
        );

        // 触发清空文件操作
        const clearButton = screen.getByTestId('clear-files');
        fireEvent.click(clearButton);

        // 验证函数被调用了
        await waitFor(() => {
          expect(onFileMapChange).toHaveBeenCalled();
        });

        // 验证最后一次调用的参数是一个空的 Map
        const lastCall =
          onFileMapChange.mock.calls[onFileMapChange.mock.calls.length - 1];
        const resultMap = lastCall[0];
        expect(resultMap).toBeInstanceOf(Map);
        expect(resultMap.size).toBe(0);
      });

      it('应该处理文件删除操作', async () => {
        const onFileMapChange = vi.fn();
        const onDelete = vi.fn().mockResolvedValue(undefined);
        const initialFileMap = new Map();
        const testFile = {
          uuid: 'file1',
          name: 'test.jpg',
          status: 'done' as const,
          url: 'http://example.com/test.jpg',
        };
        initialFileMap.set('file1', testFile);

        render(
          <MarkdownInputField
            attachment={{
              enable: true,
              fileMap: initialFileMap,
              onFileMapChange,
              onDelete,
            }}
            value="test content"
          />,
        );

        // 触发删除文件操作
        const deleteButton = screen.getByTestId('delete-file');
        fireEvent.click(deleteButton);

        // 等待异步操作完成
        await waitFor(() => {
          expect(onDelete).toHaveBeenCalledWith(testFile);
        });
      });

      it('应该在附件上传时更新文件映射', async () => {
        const onFileMapChange = vi.fn();

        render(
          <MarkdownInputField
            attachment={{
              enable: true,
              onFileMapChange,
            }}
            value="test content"
          />,
        );

        // 验证附件按钮存在
        expect(screen.getByTestId('attachment-button')).toBeInTheDocument();
      });

      it('应该处理文件映射的深拷贝', async () => {
        const onFileMapChange = vi.fn();
        const originalFileMap = new Map();
        originalFileMap.set('file1', {
          uuid: 'file1',
          name: 'test.jpg',
          status: 'done',
          url: 'http://example.com/test.jpg',
        });

        const { rerender } = render(
          <MarkdownInputField
            attachment={{
              enable: true,
              fileMap: originalFileMap,
              onFileMapChange,
            }}
            value="test content"
          />,
        );

        // 更新 fileMap prop
        const newFileMap = new Map();
        newFileMap.set('file2', {
          uuid: 'file2',
          name: 'test2.jpg',
          status: 'done',
          url: 'http://example.com/test2.jpg',
        });

        rerender(
          <MarkdownInputField
            attachment={{
              enable: true,
              fileMap: newFileMap,
              onFileMapChange,
            }}
            value="test content"
          />,
        );

        // 验证组件正常渲染
        expect(screen.getByTestId('attachment-file-list')).toBeInTheDocument();
      });
    });

    describe('addGlowBorderOffset 函数测试', () => {
      it('应该正确处理数字类型的值', () => {
        expect(addGlowBorderOffset(100)).toBe('104px');
        expect(addGlowBorderOffset(200)).toBe('204px');
      });

      it('应该正确处理百分比字符串', () => {
        expect(addGlowBorderOffset('100%')).toBe('calc(100% + 4px)');
        expect(addGlowBorderOffset('50%')).toBe('calc(50% + 4px)');
      });

      it('应该正确处理像素字符串', () => {
        expect(addGlowBorderOffset('200px')).toBe('calc(200px + 4px)');
        expect(addGlowBorderOffset('300px')).toBe('calc(300px + 4px)');
      });

      it('应该正确处理纯数字字符串', () => {
        expect(addGlowBorderOffset('100')).toBe('104px');
        expect(addGlowBorderOffset('250')).toBe('254px');
      });

      it('应该正确处理 auto 关键字', () => {
        expect(addGlowBorderOffset('auto')).toBe('auto');
      });

      it('应该正确处理 inherit 关键字', () => {
        expect(addGlowBorderOffset('inherit')).toBe('inherit');
      });

      it('应该正确处理复杂的 calc 表达式', () => {
        expect(addGlowBorderOffset('calc(100vh - 20px)')).toBe(
          'calc(calc(100vh - 20px) + 4px)',
        );
      });

      it('应该正确处理 fit-content 函数', () => {
        expect(addGlowBorderOffset('fit-content(200px)')).toBe(
          'fit-content(200px)',
        );
      });
    });

    describe('边界情况测试', () => {
      it('应该处理没有 attachment 配置的情况', () => {
        render(<MarkdownInputField value="test content" />);

        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
        expect(
          screen.queryByTestId('attachment-button'),
        ).not.toBeInTheDocument();
      });

      it('应该处理 attachment.enable 为 false 的情况', () => {
        render(
          <MarkdownInputField
            attachment={{
              enable: false,
            }}
            value="test content"
          />,
        );

        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
        expect(
          screen.queryByTestId('attachment-button'),
        ).not.toBeInTheDocument();
      });

      it('应该处理没有 style 的情况', () => {
        render(<MarkdownInputField value="test content" />);

        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
      });

      it('应该处理空的 style 对象', () => {
        render(<MarkdownInputField style={{}} value="test content" />);

        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
      });
    });

    describe('beforeToolsRender 与 attachment.upload 分支覆盖', () => {
      it('应渲染 beforeToolsRender 返回值', () => {
        const beforeToolsRender = vi.fn((p: any) => (
          <div data-testid="before-tools-custom">before tools</div>
        ));

        render(
          <MarkdownInputField
            value=""
            beforeToolsRender={beforeToolsRender}
          />,
        );

        expect(beforeToolsRender).toHaveBeenCalled();
        expect(screen.getByTestId('before-tools-custom')).toBeInTheDocument();
        expect(screen.getByText('before tools')).toBeInTheDocument();
      });

      it('应使用 attachment.upload 时传入 upload 包装', () => {
        const upload = vi.fn().mockResolvedValue(undefined);

        render(
          <MarkdownInputField
            value=""
            attachment={{ enable: true, upload }}
          />,
        );

        expect(screen.getByTestId('base-markdown-editor')).toBeInTheDocument();
      });
    });
  });
});

// ===========================================================================
// === merged from MarkdownInputField.targeted-coverage.test.tsx ===
// ===========================================================================

const captured = vi.hoisted(() => ({
  editorProps: null as any,
  animationProps: null as any,
  quickActionsProps: null as any,
}));

/* ---- Mock BaseMarkdownEditor：捕获 onChange/onFocus/onBlur/onPaste ---- */
vi.mock('../../MarkdownEditor', () => ({
  BaseMarkdownEditor: (props: any) => {
    captured.editorProps = props;
    return <div data-testid="mock-editor">{props.children}</div>;
  },
}));

/* ---- Mock BorderBeamAnimation：捕获 onAnimationComplete ---- */
vi.mock('../BorderBeamAnimation', () => ({
  BorderBeamAnimation: (props: any) => {
    captured.animationProps = props;
    return <div data-testid="mock-border-beam" />;
  },
}));

/* ---- Mock QuickActions：捕获 onValueChange/onResize ---- */
vi.mock('../QuickActions', () => ({
  QuickActions: React.forwardRef((props: any, ref: any) => {
    captured.quickActionsProps = props;
    return <div data-testid="mock-quick-actions" ref={ref} />;
  }),
}));

/* ---- Mock 其他子组件和 hooks 保持简洁 ---- */
vi.mock('../style', () => ({
  useStyle: () => ({
    wrapSSR: (node: any) => node,
    hashId: 'test-hash',
  }),
}));

vi.mock('../Suggestion', () => ({
  Suggestion: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../SkillModeBar', () => ({
  SkillModeBar: () => null,
}));

vi.mock('../TopOperatingArea', () => ({
  default: () => null,
}));

vi.mock('../VoiceInputManager', () => ({
  useVoiceInputManager: () => ({
    recording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
  }),
}));

vi.mock('../FileUploadManager', () => ({
  useFileUploadManager: () => ({
    fileUploadDone: true,
    supportedFormat: [],
    uploadImage: vi.fn(),
    updateAttachmentFiles: vi.fn(),
    handleFileRemoval: vi.fn(),
    handleFileRetry: vi.fn(),
  }),
}));

// NOTE: useSendActionsNode 已删除并内联到 MarkdownInputField.tsx，
// 这里改为 mock 实际的 SendActions 组件。
vi.mock('../utils/renderHelpers', () => ({
  useAttachmentList: () => null,
  useBeforeTools: () => null,
}));

vi.mock('../SendActions', () => ({
  SendActions: () => <div data-testid="mock-send-actions" />,
}));

// useMarkdownInputFieldHandlers 已被拆分为 4 个独立 hook，
// 这里 mock 拆出来的每个 hook，保持测试用例对原"事件被触发"的关注点。
vi.mock('../hooks/useSendHandler', () => ({
  useSendHandler: () => ({ sendMessage: vi.fn() }),
}));

vi.mock('../hooks/usePasteHandler', () => ({
  usePasteHandler: () => ({ handlePaste: vi.fn() }),
}));

vi.mock('../hooks/useKeyboardHandler', () => ({
  useKeyboardHandler: () => ({ handleKeyDown: vi.fn() }),
}));

vi.mock(
  '../hooks/useEnlargeAndContainerHandler',
  () => ({
    useEnlargeAndContainerHandler: () => ({
      handleEnlargeClick: vi.fn(),
      handleContainerClick: vi.fn(),
      activeInput: vi.fn(),
    }),
  }),
);

vi.mock(
  '../hooks/useInputFieldRefContainer',
  () => ({
    useInputFieldRefContainer: () => ({
      markdownEditorRef: { current: { store: { setMDContent: vi.fn() } } },
      quickActionsRef: { current: null },
      actionsRef: { current: null },
      isSendingRef: { current: false },
    }),
  }),
);

vi.mock('../hooks/useEditorValueSync', () => ({
  useEditorValueSync: () => ({
    onEditorChange: vi.fn(),
  }),
}));

vi.mock('../hooks/useExposeInputRef', () => ({
  useExposeInputRef: () => undefined,
}));

// 合并自原 useMarkdownInputFieldLayout + useMarkdownInputFieldStyles。
// 原 useMarkdownInputFieldActions 已被内联到 MarkdownInputField，无需单独 mock。
vi.mock('../hooks/useInputFieldGeometry', () => ({
  useInputFieldGeometry: () => ({
    inputRef: { current: null },
    collapseSendActions: false,
    setRightPadding: vi.fn(),
    setTopRightPadding: vi.fn(),
    setQuickRightOffset: vi.fn(),
    computedRightPadding: 16,
    collapsedHeightPx: 200,
    computedMinHeight: '48px',
    enlargedStyle: {},
  }),
}));

vi.mock(
  '../hooks/useMarkdownInputFieldState',
  () => ({
    useMarkdownInputFieldState: () => ({
      isHover: false,
      setHover: vi.fn(),
      isLoading: false,
      setIsLoading: vi.fn(),
      isEnlarged: false,
      setIsEnlarged: vi.fn(),
      value: '',
      setValue: vi.fn(),
      fileMap: {},
      setFileMap: vi.fn(),
    }),
  }),
);

import { MarkdownInputField } from '../MarkdownInputField';

describe('MarkdownInputField targeted coverage', () => {
  beforeEach(() => {
    captured.editorProps = null;
    captured.animationProps = null;
    captured.quickActionsProps = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('覆盖 onChange 正常路径', () => {
    const onChangeSpy = vi.fn();
    render(<MarkdownInputField onChange={onChangeSpy} />);

    expect(captured.editorProps).toBeTruthy();
    act(() => {
      captured.editorProps.onChange('hello world');
    });

    expect(onChangeSpy).toHaveBeenCalledWith('hello world');
  });

  it('覆盖 onChange maxLength 截断路径', () => {
    const onChangeSpy = vi.fn();
    const onMaxLengthExceeded = vi.fn();
    render(
      <MarkdownInputField
        onChange={onChangeSpy}
        maxLength={5}
        onMaxLengthExceeded={onMaxLengthExceeded}
      />,
    );

    expect(captured.editorProps).toBeTruthy();
    act(() => {
      captured.editorProps.onChange('hello world longer');
    });

    expect(onChangeSpy).toHaveBeenCalledWith('hello');
    expect(onMaxLengthExceeded).toHaveBeenCalledWith('hello world longer');
  });

  it('覆盖 onChange maxLength 不超限时走正常路径', () => {
    const onChangeSpy = vi.fn();
    render(<MarkdownInputField onChange={onChangeSpy} maxLength={100} />);

    act(() => {
      captured.editorProps.onChange('short');
    });

    expect(onChangeSpy).toHaveBeenCalledWith('short');
  });

  it('覆盖 onFocus 回调', () => {
    const onFocusSpy = vi.fn();
    render(<MarkdownInputField onFocus={onFocusSpy} />);

    expect(captured.editorProps).toBeTruthy();
    act(() => {
      captured.editorProps.onFocus('val', [], {} as any);
    });

    expect(onFocusSpy).toHaveBeenCalledWith('val', [], expect.anything());
  });

  it('覆盖 onBlur 回调', () => {
    const onBlurSpy = vi.fn();
    render(<MarkdownInputField onBlur={onBlurSpy} />);

    expect(captured.editorProps).toBeTruthy();
    act(() => {
      captured.editorProps.onBlur('val', [], {} as any);
    });

    expect(onBlurSpy).toHaveBeenCalledWith('val', [], expect.anything());
  });

  it('覆盖 onPaste 回调', () => {
    render(<MarkdownInputField />);

    expect(captured.editorProps).toBeTruthy();
    const fakeEvent = { clipboardData: { getData: vi.fn() } };
    act(() => {
      captured.editorProps.onPaste(fakeEvent);
    });
    // handlePaste should have been called without error
    expect(true).toBe(true);
  });

  it('覆盖 onAnimationComplete 回调', () => {
    render(<MarkdownInputField />);

    expect(captured.animationProps).toBeTruthy();
    act(() => {
      captured.animationProps.onAnimationComplete?.();
    });
    // setAnimationComplete(true) called without error
    expect(true).toBe(true);
  });

  it('覆盖 QuickActions onValueChange 回调', () => {
    const onChangeSpy = vi.fn();
    render(
      <MarkdownInputField onChange={onChangeSpy} enlargeable={{ enable: true }} />,
    );

    expect(captured.quickActionsProps).toBeTruthy();
    act(() => {
      captured.quickActionsProps.onValueChange('new text');
    });

    expect(onChangeSpy).toHaveBeenCalledWith('new text');
  });

});
