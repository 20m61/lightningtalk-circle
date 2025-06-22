/**
 * Lightning Talk Design System - Typography Tokens
 */

export const typography = {
  // Font Families
  fonts: {
    primary: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(', '),
    
    secondary: [
      '"Inter"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'sans-serif',
    ].join(', '),
    
    mono: [
      '"SF Mono"',
      'Monaco',
      '"Cascadia Code"',
      '"Roboto Mono"',
      'Consolas',
      '"Courier New"',
      'monospace',
    ].join(', '),
    
    // WordPress Admin Font Stack
    wordpress: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Oxygen-Sans',
      'Ubuntu',
      'Cantarell',
      '"Helvetica Neue"',
      'sans-serif',
    ].join(', '),
  },
  
  // Font Sizes (Mobile First)
  sizes: {
    xs: {
      mobile: '0.75rem',    // 12px
      desktop: '0.75rem',   // 12px
    },
    sm: {
      mobile: '0.875rem',   // 14px
      desktop: '0.875rem',  // 14px
    },
    base: {
      mobile: '1rem',       // 16px
      desktop: '1rem',      // 16px
    },
    lg: {
      mobile: '1.125rem',   // 18px
      desktop: '1.125rem',  // 18px
    },
    xl: {
      mobile: '1.25rem',    // 20px
      desktop: '1.25rem',   // 20px
    },
    '2xl': {
      mobile: '1.5rem',     // 24px
      desktop: '1.5rem',    // 24px
    },
    '3xl': {
      mobile: '1.875rem',   // 30px
      desktop: '1.875rem',  // 30px
    },
    '4xl': {
      mobile: '2.25rem',    // 36px
      desktop: '2.25rem',   // 36px
    },
    '5xl': {
      mobile: '3rem',       // 48px
      desktop: '3rem',      // 48px
    },
  },
  
  // Line Heights
  lineHeights: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Font Weights
  weights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text Styles (Preset combinations)
  styles: {
    // Headings
    h1: {
      fontSize: { mobile: '2.25rem', desktop: '3rem' },
      lineHeight: 1.2,
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: { mobile: '1.875rem', desktop: '2.25rem' },
      lineHeight: 1.3,
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: { mobile: '1.5rem', desktop: '1.875rem' },
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: 'normal',
    },
    h4: {
      fontSize: { mobile: '1.25rem', desktop: '1.5rem' },
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: 'normal',
    },
    h5: {
      fontSize: { mobile: '1.125rem', desktop: '1.25rem' },
      lineHeight: 1.5,
      fontWeight: 600,
      letterSpacing: 'normal',
    },
    h6: {
      fontSize: { mobile: '1rem', desktop: '1.125rem' },
      lineHeight: 1.5,
      fontWeight: 600,
      letterSpacing: 'normal',
    },
    
    // Body Text
    body: {
      fontSize: { mobile: '1rem', desktop: '1rem' },
      lineHeight: 1.6,
      fontWeight: 400,
      letterSpacing: 'normal',
    },
    bodyLarge: {
      fontSize: { mobile: '1.125rem', desktop: '1.125rem' },
      lineHeight: 1.6,
      fontWeight: 400,
      letterSpacing: 'normal',
    },
    bodySmall: {
      fontSize: { mobile: '0.875rem', desktop: '0.875rem' },
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: 'normal',
    },
    
    // UI Elements
    button: {
      fontSize: { mobile: '0.875rem', desktop: '1rem' },
      lineHeight: 1.5,
      fontWeight: 500,
      letterSpacing: '0.025em',
    },
    buttonLarge: {
      fontSize: { mobile: '1rem', desktop: '1.125rem' },
      lineHeight: 1.5,
      fontWeight: 500,
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: { mobile: '0.75rem', desktop: '0.875rem' },
      lineHeight: 1.4,
      fontWeight: 400,
      letterSpacing: '0.025em',
    },
    label: {
      fontSize: { mobile: '0.875rem', desktop: '0.875rem' },
      lineHeight: 1.4,
      fontWeight: 500,
      letterSpacing: '0.025em',
    },
    
    // Lightning Talk Specific
    eventTitle: {
      fontSize: { mobile: '1.5rem', desktop: '1.875rem' },
      lineHeight: 1.3,
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    talkTitle: {
      fontSize: { mobile: '1.125rem', desktop: '1.25rem' },
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: 'normal',
    },
    speakerName: {
      fontSize: { mobile: '1rem', desktop: '1rem' },
      lineHeight: 1.5,
      fontWeight: 500,
      letterSpacing: 'normal',
    },
    countdown: {
      fontSize: { mobile: '2rem', desktop: '3rem' },
      lineHeight: 1,
      fontWeight: 800,
      letterSpacing: '-0.05em',
    },
  },
} as const;

// Type definitions
export type FontSize = keyof typeof typography.sizes;
export type FontWeight = keyof typeof typography.weights;
export type LineHeight = keyof typeof typography.lineHeights;
export type LetterSpacing = keyof typeof typography.letterSpacing;
export type TextStyle = keyof typeof typography.styles;

// Helper functions
export const getFontSize = (size: FontSize, breakpoint: 'mobile' | 'desktop' = 'mobile'): string => {
  return typography.sizes[size][breakpoint];
};

export const getTextStyle = (style: TextStyle) => {
  return typography.styles[style];
};

// CSS Custom Properties Generator
export const generateTypographyCSS = (): string => {
  const cssVars = [];
  
  // Font families
  Object.entries(typography.fonts).forEach(([key, value]) => {
    cssVars.push(`--font-${key}: ${value};`);
  });
  
  // Font sizes
  Object.entries(typography.sizes).forEach(([key, value]) => {
    cssVars.push(`--text-${key}: ${value.mobile};`);
    cssVars.push(`--text-${key}-desktop: ${value.desktop};`);
  });
  
  // Font weights
  Object.entries(typography.weights).forEach(([key, value]) => {
    cssVars.push(`--font-weight-${key}: ${value};`);
  });
  
  return `:root {\n  ${cssVars.join('\n  ')}\n}`;
};