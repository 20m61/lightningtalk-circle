/**
 * Lightning Talk Circle - Button Component
 * 統合デザイントークンシステム対応のボタンコンポーネント
 */

import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
  /** ボタンのテキスト */
  children: React.ReactNode;
  
  /** ボタンのバリエーション */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'lightning';
  
  /** ボタンのサイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** ボタンの状態 */
  state?: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
  
  /** フルワイドスタイル */
  fullWidth?: boolean;
  
  /** Lightning Talk専用エフェクト */
  lightningEffect?: boolean;
  
  /** アイコン（左側） */
  iconLeft?: React.ReactNode;
  
  /** アイコン（右側） */
  iconRight?: React.ReactNode;
  
  /** アクセシビリティ */
  'aria-label'?: string;
  
  /** HTMLボタン属性 */
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  
  /** CSS class name */
  className?: string;
  
  /** インラインスタイル */
  style?: React.CSSProperties;
  
  /** WordPress互換 */
  id?: string;
}

/**
 * Lightning Talk Circle ボタンコンポーネント
 * 
 * ## 特徴
 * - ⚡ Lightning Talk専用ブランドスタイリング
 * - 🎨 統合デザイントークンシステム対応
 * - ♿ WCAG 2.1 AAアクセシビリティ準拠
 * - 📱 レスポンシブデザイン対応
 * - 🚀 パフォーマンス最適化
 * - 🌈 ダークモード対応
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" lightningEffect>
 *   Lightning Talk開始
 * </Button>
 * 
 * <Button variant="lightning" iconLeft={<ZapIcon />}>
 *   ⚡ エネルギッシュなボタン
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  state = 'default',
  fullWidth = false,
  lightningEffect = false,
  iconLeft,
  iconRight,
  type = 'button',
  disabled = false,
  onClick,
  onFocus,
  onBlur,
  className,
  style,
  id,
  'aria-label': ariaLabel,
  ...props
}) => {
  // クラス名の構築
  const baseClasses = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth && styles.fullWidth,
    lightningEffect && styles.lightningEffect,
    state !== 'default' && styles[`state-${state}`],
    className
  ].filter(Boolean).join(' ');

  // Lightning Effect用の追加要素
  const lightningEffectElements = lightningEffect ? (
    <>
      <span className={styles.lightningGlow} aria-hidden="true" />
      <span className={styles.lightningSpark} aria-hidden="true" />
    </>
  ) : null;

  // ローディング状態のスピナー
  const loadingSpinner = state === 'loading' ? (
    <span className={styles.loadingSpinner} aria-hidden="true" />
  ) : null;

  return (
    <button
      type={type}
      disabled={disabled || state === 'disabled' || state === 'loading'}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      className={baseClasses}
      style={style}
      id={id}
      aria-label={ariaLabel}
      aria-busy={state === 'loading'}
      {...props}
    >
      {lightningEffectElements}
      {state === 'loading' && loadingSpinner}
      
      <span className={styles.buttonContent}>
        {iconLeft && <span className={styles.iconLeft} aria-hidden="true">{iconLeft}</span>}
        <span className={styles.buttonText}>{children}</span>
        {iconRight && <span className={styles.iconRight} aria-hidden="true">{iconRight}</span>}
      </span>
    </button>
  );
};

Button.displayName = 'Button';

export default Button;