/**
 * Lightning Talk Design System - Color Tokens
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#FF6B35', // Main brand color
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  
  // Secondary Colors
  secondary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#4ECDC4', // Lightning Talk turquoise
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  
  // Semantic Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Neutral Grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Text Colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#2563EB',
    linkHover: '#1D4ED8',
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    overlay: 'rgba(0, 0, 0, 0.5)',
    card: '#FFFFFF',
    input: '#FFFFFF',
  },
  
  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
    focus: '#2563EB',
    error: '#EF4444',
    success: '#10B981',
  },
  
  // WordPress Admin Colors
  wordpress: {
    adminBlue: '#0073AA',
    adminGray: '#23282D',
    adminLight: '#F0F0F1',
    noticeYellow: '#F7DA00',
    noticeRed: '#DC3232',
    noticeGreen: '#46B450',
  },
  
  // Lightning Talk Specific
  lightningTalk: {
    electric: '#FFD700', // Gold/Electric
    speaker: '#8B5CF6', // Purple for speakers
    audience: '#06B6D4', // Cyan for audience
    stage: '#F59E0B', // Amber for stage/presentation
    network: '#10B981', // Green for networking
  },
} as const;

// Type definitions
export type ColorScale = typeof colors.primary;
export type ColorToken = keyof typeof colors;

// Helper functions
export const getColor = (token: string, shade?: number): string => {
  const [colorName, colorShade] = token.split('.');
  const colorGroup = colors[colorName as keyof typeof colors];
  
  if (!colorGroup) return '#000000';
  
  if (typeof colorGroup === 'string') return colorGroup;
  
  const shadeKey = shade || parseInt(colorShade) || 500;
  return (colorGroup as any)[shadeKey] || '#000000';
};

export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - in production, use a proper color contrast library
  const brightness = parseInt(backgroundColor.replace('#', ''), 16);
  return brightness > 0x888888 ? colors.text.primary : colors.text.inverse;
};