/**
 * Lightning Talk Design System - Spacing Tokens
 */

export const spacing = {
  // Base unit: 0.25rem (4px)
  // Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 128px

  // Pixel values for reference
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px

  // Component-specific spacing
  component: {
    // Button padding
    buttonPaddingX: {
      sm: '0.75rem', // 12px
      md: '1rem', // 16px
      lg: '1.5rem' // 24px
    },
    buttonPaddingY: {
      sm: '0.375rem', // 6px
      md: '0.5rem', // 8px
      lg: '0.75rem' // 12px
    },

    // Card spacing
    cardPadding: {
      sm: '1rem', // 16px
      md: '1.5rem', // 24px
      lg: '2rem' // 32px
    },

    // Form elements
    inputPadding: {
      x: '0.75rem', // 12px
      y: '0.5rem' // 8px
    },

    // Layout sections
    sectionPadding: {
      mobile: '1rem', // 16px
      tablet: '2rem', // 32px
      desktop: '3rem' // 48px
    },

    // Lightning Talk specific
    eventCard: {
      padding: '1.5rem', // 24px
      gap: '1rem', // 16px
      titleMargin: '0.5rem' // 8px
    },

    talkItem: {
      padding: '1rem', // 16px
      gap: '0.75rem', // 12px
      margin: '0.5rem' // 8px
    },

    participantList: {
      itemPadding: '0.75rem', // 12px
      itemGap: '0.5rem' // 8px
    },

    // Touch targets (mobile)
    touchTarget: {
      min: '44px', // Minimum touch target size
      comfortable: '48px', // Comfortable touch target
      large: '56px' // Large touch target
    }
  },

  // Container sizes
  container: {
    xs: '20rem', // 320px
    sm: '24rem', // 384px
    md: '28rem', // 448px
    lg: '32rem', // 512px
    xl: '36rem', // 576px
    '2xl': '42rem', // 672px
    '3xl': '48rem', // 768px
    '4xl': '56rem', // 896px
    '5xl': '64rem', // 1024px
    '6xl': '72rem', // 1152px
    '7xl': '80rem' // 1280px
  },

  // Breakpoint-specific spacing
  responsive: {
    gutter: {
      mobile: '1rem', // 16px
      tablet: '1.5rem', // 24px
      desktop: '2rem' // 32px
    },

    margin: {
      mobile: '1rem', // 16px
      tablet: '2rem', // 32px
      desktop: '3rem' // 48px
    },

    padding: {
      mobile: '1rem', // 16px
      tablet: '1.5rem', // 24px
      desktop: '2rem' // 32px
    }
  },

  // Grid spacing
  grid: {
    gap: {
      xs: '0.5rem', // 8px
      sm: '1rem', // 16px
      md: '1.5rem', // 24px
      lg: '2rem', // 32px
      xl: '3rem' // 48px
    }
  }
} as const;

// Type definitions
export type SpacingToken = keyof typeof spacing;
export type ComponentSpacing = keyof typeof spacing.component;
export type ResponsiveSpacing = keyof typeof spacing.responsive;

// Helper functions
export const getSpacing = (token: SpacingToken | string): string => {
  if (typeof token === 'string' && token in spacing) {
    const value = spacing[token as SpacingToken];
    // Handle numeric keys and ensure we return a string
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'object') {
      return '1rem'; // Default for object values
    }
  }
  // Ensure we always return a string
  return typeof token === 'string' ? token : '1rem';
};

export const getComponentSpacing = (component: ComponentSpacing, size?: string): string => {
  const componentSpacing = spacing.component[component];
  if (typeof componentSpacing === 'string') {
    return componentSpacing;
  }
  if (typeof componentSpacing === 'object' && size) {
    // Handle objects with different structures
    const value = (componentSpacing as any)[size];
    if (value) return value;

    // Try common defaults
    if ('md' in componentSpacing) return (componentSpacing as any).md;

    // Return first value as fallback
    const values = Object.values(componentSpacing);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
    }
  }
  return '1rem';
};

// Responsive spacing helper
export const getResponsiveSpacing = (
  type: ResponsiveSpacing,
  breakpoint: 'mobile' | 'tablet' | 'desktop' = 'mobile'
): string => {
  const responsiveSpacing = spacing.responsive[type];
  return responsiveSpacing[breakpoint];
};

// CSS Custom Properties Generator
export const generateSpacingCSS = (): string => {
  const cssVars: string[] = [];

  // Base spacing scale
  Object.entries(spacing).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVars.push(`--space-${key}: ${value};`);
    }
  });

  // Component spacing
  Object.entries(spacing.component).forEach(([component, values]) => {
    if (typeof values === 'string') {
      cssVars.push(`--space-${component}: ${values};`);
    } else if (typeof values === 'object') {
      Object.entries(values).forEach(([size, value]) => {
        cssVars.push(`--space-${component}-${size}: ${value};`);
      });
    }
  });

  return `:root {\n  ${cssVars.join('\n  ')}\n}`;
};
