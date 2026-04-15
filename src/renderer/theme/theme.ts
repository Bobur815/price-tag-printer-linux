// Theme configuration for styled-components

export const theme = {
  colors: {
    // Background colors
    background: '#f5f5f5',
    surface: '#ffffff',

    // Text colors
    text: '#1f2937',
    textSecondary: '#6b7280',

    // Brand colors
    primary: '#3b82f6',
    secondary: '#8b5cf6',

    // Status colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',

    // UI colors
    border: '#e5e7eb',
    hover: '#f3f4f6',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  borderRadius: '6px',

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
};

export type Theme = typeof theme;

// TypeScript module augmentation for styled-components
declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
