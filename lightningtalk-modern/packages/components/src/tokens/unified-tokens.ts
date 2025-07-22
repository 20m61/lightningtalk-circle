/**
 * Lightning Talk Circle - Unified Design Tokens
 * 統合デザイントークンシステム
 * 
 * このファイルは全プラットフォーム（Web、WordPress、Mobile）で
 * 一貫したデザインを提供するための統一トークン定義です。
 */

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface LightningColors {
  spark: string;
  glow: string;
  electric: string;
}

export interface SemanticColors {
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;
}

export interface Typography {
  fontFamily: {
    primary: string;
    mono: string;
    japanese: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tighter: string;
    normal: string;
    wider: string;
  };
}

export interface Spacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

export interface Animations {
  lightning: {
    pulse: string;
    strike: string;
    glow: string;
    spark: string;
    bounce: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
    bounce: string;
  };
  keyframes: {
    [key: string]: string;
  };
}

export interface Breakpoints {
  mobile: {
    small: string;
    medium: string;
    large: string;
  };
  tablet: string;
  desktop: {
    small: string;
    medium: string;
    large: string;
    xl: string;
  };
}

// Lightning Talk Circle 統合デザイントークン
export const lightningTalkTokens = {
  // ブランドカラー - Lightning Talk専用
  colors: {
    // プライマリ: Electric Orange (Lightning Orange)
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#ff6b35', // メインブランドカラー - Lightning Electric Orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407'
    } as ColorPalette,

    // セカンダリ: Electric Turquoise (Lightning Turquoise)  
    secondary: {
      50: '#f0fdfc',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#4ecdc4', // Lightning Electric Turquoise
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344'
    } as ColorPalette,

    // ニュートラル - グレースケール
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5', 
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a'
    } as ColorPalette,

    // Lightning Talk専用カラー
    lightning: {
      spark: '#FFD700',           // Golden Spark
      glow: 'rgba(255, 107, 53, 0.4)', // Orange Glow
      electric: '#00FFFF'         // Electric Blue
    } as LightningColors,

    // セマンティックカラー  
    semantic: {
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // Success Green
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
        950: '#052e16'
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fbbf24',
        500: '#f59e0b', // Warning Amber
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        950: '#451a03'
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444', // Error Red
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a'
      },
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6', // Info Blue
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554'
      }
    } as SemanticColors
  },

  // タイポグラフィ - 流体タイポグラフィ対応
  typography: {
    fontFamily: {
      primary: '"Noto Sans JP", "Yu Gothic", "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
      japanese: '"Noto Sans JP", "Yu Gothic", "Hiragino Sans", "Meiryo", sans-serif'
    },
    fontSize: {
      xs: 'clamp(0.75rem, 1.5vw, 0.875rem)',      // 12-14px
      sm: 'clamp(0.875rem, 2vw, 1rem)',           // 14-16px  
      base: 'clamp(1rem, 2.5vw, 1.125rem)',       // 16-18px
      lg: 'clamp(1.125rem, 3vw, 1.25rem)',        // 18-20px
      xl: 'clamp(1.25rem, 3.5vw, 1.5rem)',        // 20-24px
      '2xl': 'clamp(1.5rem, 4vw, 2rem)',          // 24-32px
      '3xl': 'clamp(1.875rem, 5vw, 2.5rem)',      // 30-40px
      '4xl': 'clamp(2.25rem, 6vw, 3rem)',         // 36-48px
      '5xl': 'clamp(2.75rem, 7vw, 4rem)'          // 44-64px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.6,
      relaxed: 1.8
    },
    letterSpacing: {
      tighter: '-0.05em',
      normal: '0em',
      wider: '0.05em'
    }
  } as Typography,

  // スペーシング - 8pxベースシステム
  spacing: {
    0: '0px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px (ベース)
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    56: '14rem',    // 224px
    64: '16rem'     // 256px
  } as Spacing,

  // Lightning Talk専用アニメーション
  animations: {
    lightning: {
      pulse: 'lightning-pulse 1000ms ease-in-out infinite',
      strike: 'lightning-strike 200ms ease-out',
      glow: 'lightning-glow 2000ms ease-in-out infinite alternate',
      spark: 'lightning-spark 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      bounce: 'lightning-bounce 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    transitions: {
      fast: 'all 150ms ease-out',
      normal: 'all 300ms ease-in-out', 
      slow: 'all 500ms ease-in-out',
      bounce: 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    keyframes: {
      'lightning-pulse': `
        0%, 100% { box-shadow: 0 0 5px rgba(255, 107, 53, 0.5); }
        50% { box-shadow: 0 0 20px rgba(255, 107, 53, 0.8), 0 0 30px rgba(255, 107, 53, 0.6); }
      `,
      'lightning-strike': `
        0% { transform: translateY(-2px) scale(1.02); }
        100% { transform: translateY(0) scale(1); }
      `,
      'lightning-glow': `
        0% { box-shadow: 0 0 10px rgba(255, 107, 53, 0.3); }
        100% { box-shadow: 0 0 25px rgba(255, 107, 53, 0.7), 0 0 40px rgba(78, 205, 196, 0.4); }
      `,
      'lightning-spark': `
        0% { transform: scale(0.95); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      `,
      'lightning-bounce': `
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
        40%, 43% { transform: translate3d(0, -8px, 0); }
        70% { transform: translate3d(0, -4px, 0); }
        90% { transform: translate3d(0, -2px, 0); }
      `
    }
  } as Animations,

  // レスポンシブブレイクポイント
  breakpoints: {
    mobile: {
      small: '320px',   // iPhone SE
      medium: '375px',  // iPhone X/11/12/13
      large: '414px'    // iPhone Plus
    },
    tablet: '768px',    // iPad
    desktop: {
      small: '1024px',  // 小型デスクトップ
      medium: '1280px', // デスクトップ
      large: '1440px',  // 大型デスクトップ  
      xl: '1920px'      // フルHD
    }
  } as Breakpoints,

  // 影・エレベーション
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    // Lightning専用影
    lightning: {
      glow: '0 0 20px rgba(255, 107, 53, 0.4)',
      spark: '0 0 10px rgba(255, 215, 0, 0.6)',
      electric: '0 0 15px rgba(0, 255, 255, 0.3)'
    }
  },

  // 角丸
  borderRadius: {
    none: '0px',
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  }
};

// CSS Custom Properties 生成関数
export function generateCSSCustomProperties(tokens: typeof lightningTalkTokens): string {
  const cssVars: string[] = [];
  
  // カラー変数生成
  Object.entries(tokens.colors.primary).forEach(([key, value]) => {
    cssVars.push(`  --color-primary-${key}: ${value};`);
  });
  
  Object.entries(tokens.colors.secondary).forEach(([key, value]) => {
    cssVars.push(`  --color-secondary-${key}: ${value};`);
  });
  
  Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
    cssVars.push(`  --color-neutral-${key}: ${value};`);
  });
  
  Object.entries(tokens.colors.lightning).forEach(([key, value]) => {
    cssVars.push(`  --color-lightning-${key}: ${value};`);
  });
  
  // タイポグラフィ変数生成
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`  --font-size-${key}: ${value};`);
  });
  
  // スペーシング変数生成
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars.push(`  --spacing-${key}: ${value};`);
  });
  
  // アニメーション変数生成
  Object.entries(tokens.animations.lightning).forEach(([key, value]) => {
    cssVars.push(`  --animation-lightning-${key}: ${value};`);
  });
  
  return `:root {\n${cssVars.join('\n')}\n}`;
}

// JavaScript/TypeScript用のトークンエクスポート
export default lightningTalkTokens;