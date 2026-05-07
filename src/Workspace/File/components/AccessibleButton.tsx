import React, { memo, useCallback } from 'react';
import { handleKeyboardEvent } from '../handlers';

export interface AccessibleButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  ariaLabel: string;
  id?: string;
}

/**
 * 可访问按钮：将任意内容包裹为带键盘 a11y 的 role="button" 容器
 */
const AccessibleButtonComponent: React.FC<AccessibleButtonProps> = ({
  icon,
  onClick,
  className,
  ariaLabel,
  id,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      handleKeyboardEvent(e, () => {
        // 键盘触发时构造一个模拟的鼠标点击，复用 onClick 回调
        (e.currentTarget as HTMLElement).click();
      });
    },
    [],
  );

  return (
    <div
      id={id}
      className={className}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
    >
      {icon}
    </div>
  );
};

AccessibleButtonComponent.displayName = 'AccessibleButton';

export const AccessibleButton = memo(AccessibleButtonComponent);
