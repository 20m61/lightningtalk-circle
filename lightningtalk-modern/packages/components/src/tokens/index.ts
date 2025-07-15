/**
 * Lightning Talk Design System - Design Tokens
 *
 * Central export for all design tokens
 */

import { colors, getColor, getContrastColor } from './colors';
import { typography, getFontSize, getTextStyle, generateTypographyCSS } from './typography';
import {
  spacing,
  getSpacing,
  getComponentSpacing,
  getResponsiveSpacing,
  generateSpacingCSS
} from './spacing';

export { colors, getColor, getContrastColor };
export type { ColorScale, ColorToken } from './colors';

export { typography, getFontSize, getTextStyle, generateTypographyCSS };
export type { FontSize, FontWeight, LineHeight, LetterSpacing, TextStyle } from './typography';

export { spacing, getSpacing, getComponentSpacing, getResponsiveSpacing, generateSpacingCSS };
export type { SpacingToken, ComponentSpacing, ResponsiveSpacing } from './spacing';

// Breakpoints
export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Z-index scale
export const zIndex = {
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  banner: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
  maximum: 2147483647
} as const;

export type ZIndex = keyof typeof zIndex;

// Shadows
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Lightning Talk specific shadows
  card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  button: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  buttonHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
} as const;

export type Shadow = keyof typeof shadows;

// Border radius
export const radii = {
  none: '0',
  xs: '0.125rem', // 2px
  sm: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',

  // Component specific
  button: '0.375rem', // 6px
  card: '0.5rem', // 8px
  input: '0.375rem', // 6px
  modal: '0.75rem', // 12px
  avatar: '9999px' // full circle
} as const;

export type Radius = keyof typeof radii;

// Transitions
export const transitions = {
  none: 'none',
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
  slower: '500ms ease',

  // Specific properties
  colors: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
  transform: 'transform 200ms ease',
  opacity: 'opacity 150ms ease',
  shadow: 'box-shadow 200ms ease',

  // Lightning Talk specific
  cardHover: 'transform 200ms ease, box-shadow 200ms ease',
  buttonHover: 'all 150ms ease',
  fadeIn: 'opacity 300ms ease',
  input: 'border-color 150ms ease, box-shadow 150ms ease'
} as const;

export type Transition = keyof typeof transitions;

// Complete design tokens object
export const tokens = {
  colors,
  typography,
  spacing,
  breakpoints,
  zIndex,
  shadows,
  radii,
  transitions
} as const;

// CSS Custom Properties generator for all tokens
export const generateTokensCSS = (): string => {
  const cssVars: string[] = [];

  // Colors
  Object.entries(colors).forEach(([group, values]) => {
    if (typeof values === 'string') {
      cssVars.push(`--color-${group}: ${values};`);
    } else if (typeof values === 'object' && values !== null) {
      Object.entries(values).forEach(([shade, value]) => {
        cssVars.push(`--color-${group}-${shade}: ${value};`);
      });
    }
  });

  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });

  // Border radius
  Object.entries(radii).forEach(([key, value]) => {
    cssVars.push(`--radius-${key}: ${value};`);
  });

  // Z-index
  Object.entries(zIndex).forEach(([key, value]) => {
    cssVars.push(`--z-${key}: ${value};`);
  });

  // Transitions
  Object.entries(transitions).forEach(([key, value]) => {
    cssVars.push(`--transition-${key}: ${value};`);
  });

  return (
    `:root {\n  ${cssVars.join('\n  ')}\n}` +
    '\n\n' +
    generateTypographyCSS() +
    '\n\n' +
    generateSpacingCSS()
  );
};
