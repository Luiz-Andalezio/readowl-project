declare module '@tiptap/react' {
  import * as React from 'react';
  export const BubbleMenu: React.ComponentType<{
    children?: React.ReactNode;
    editor?: unknown;
    tippyOptions?: unknown;
    className?: string;
  }>;
  export const FloatingMenu: React.ComponentType<{
    children?: React.ReactNode;
    editor?: unknown;
    tippyOptions?: unknown;
    className?: string;
  }>;
}
