import React from 'react';

export const LOADING_SIZE = 16;

const ARROW_STYLE_COLLAPSED: React.CSSProperties = {
  transform: 'rotate(0deg)',
  transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
};

const ARROW_STYLE_EXPANDED: React.CSSProperties = {
  transform: 'rotate(180deg)',
  transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const getArrowRotation = (collapsed: boolean): React.CSSProperties =>
  collapsed ? ARROW_STYLE_COLLAPSED : ARROW_STYLE_EXPANDED;

export const hasTaskContent = (
  content: React.ReactNode | React.ReactNode[],
) => {
  if (Array.isArray(content)) {
    return content.length > 0;
  }
  return !!content;
};
