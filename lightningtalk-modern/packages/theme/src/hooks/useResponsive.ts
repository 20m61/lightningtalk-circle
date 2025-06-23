/**
 * useResponsive Hook
 * レスポンシブ状態とブレークポイントを管理するReactフック
 */

import { useState, useEffect, useCallback } from 'react';

interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface ResponsiveState {
  currentBreakpoint: keyof BreakpointConfig;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  isXxl: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  pixelRatio: number;
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536
};

/**
 * レスポンシブ状態を管理するカスタムフック
 */
export function useResponsive(customBreakpoints?: Partial<BreakpointConfig>) {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  const [state, setState] = useState<ResponsiveState>(() => 
    getResponsiveState(breakpoints)
  );

  const updateState = useCallback(() => {
    setState(getResponsiveState(breakpoints));
  }, [breakpoints]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      // デバウンス処理
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 100);
    };

    const handleOrientationChange = () => {
      // orientation change は少し遅延を入れる
      setTimeout(updateState, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(timeoutId);
    };
  }, [updateState]);

  return state;
}

/**
 * ブレークポイント判定用フック
 */
export function useBreakpoint(breakpoint: keyof BreakpointConfig, customBreakpoints?: Partial<BreakpointConfig>) {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  const [matches, setMatches] = useState(() => 
    window.innerWidth >= breakpoints[breakpoint]
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 初期値の設定
    setMatches(mediaQuery.matches);
    
    // リスナーの追加
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [breakpoint, breakpoints]);

  return matches;
}

/**
 * メディアクエリ用フック
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * ビューポートサイズ用フック
 */
export function useViewport() {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }));

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewport;
}

/**
 * デバイス向き用フック
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => 
    getOrientation()
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(() => {
        setOrientation(getOrientation());
      }, 300); // orientation change は遅延が必要
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * タッチデバイス判定用フック
 */
export function useTouch() {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    // タッチイベントの動的検出
    const handleTouchStart = () => {
      setIsTouch(true);
      document.removeEventListener('touchstart', handleTouchStart);
    };

    if (!isTouch) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isTouch]);

  return isTouch;
}

/**
 * ダークモード用フック
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // localStorage からの設定を優先
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    
    // システム設定を確認
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      // localStorage に設定がない場合のみシステム設定に従う
      const saved = localStorage.getItem('darkMode');
      if (saved === null) {
        setIsDark(event.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      
      // ドキュメントにクラスを追加/削除
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return newValue;
    });
  }, []);

  useEffect(() => {
    // 初期化時にクラスを設定
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return { isDark, toggleDarkMode };
}

/**
 * Reduced Motion 用フック
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return reducedMotion;
}

// ヘルパー関数
function getResponsiveState(breakpoints: BreakpointConfig): ResponsiveState {
  if (typeof window === 'undefined') {
    return {
      currentBreakpoint: 'xs',
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      isXs: true,
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      isXxl: false,
      width: 0,
      height: 0,
      orientation: 'portrait',
      isTouch: false,
      pixelRatio: 1
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  
  let currentBreakpoint: keyof BreakpointConfig = 'xs';
  
  if (width >= breakpoints.xxl) currentBreakpoint = 'xxl';
  else if (width >= breakpoints.xl) currentBreakpoint = 'xl';
  else if (width >= breakpoints.lg) currentBreakpoint = 'lg';
  else if (width >= breakpoints.md) currentBreakpoint = 'md';
  else if (width >= breakpoints.sm) currentBreakpoint = 'sm';

  return {
    currentBreakpoint,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isXs: width < breakpoints.sm,
    isSm: width >= breakpoints.sm && width < breakpoints.md,
    isMd: width >= breakpoints.md && width < breakpoints.lg,
    isLg: width >= breakpoints.lg && width < breakpoints.xl,
    isXl: width >= breakpoints.xl && width < breakpoints.xxl,
    isXxl: width >= breakpoints.xxl,
    width,
    height,
    orientation: getOrientation(),
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pixelRatio: window.devicePixelRatio || 1
  };
}

function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';
  
  // window.orientation を優先（モバイルデバイス）
  if (typeof window.orientation !== 'undefined') {
    return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
  }
  
  // フォールバック: width/height 比較
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

/**
 * コンポーネント向けのユーティリティフック
 */
export function useResponsiveValue<T>(values: Partial<Record<keyof BreakpointConfig, T>>, defaultValue: T): T {
  const { currentBreakpoint } = useResponsive();
  
  // 現在のブレークポイントから適切な値を取得
  const breakpointOrder: (keyof BreakpointConfig)[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // 現在のブレークポイント以下で最初に見つかった値を返す
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }
  
  return defaultValue;
}