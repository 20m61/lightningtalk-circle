/**
 * Button Component
 *
 * Accessible, customizable button component for Lightning Talk application
 */

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

  /**
   * Size of the button
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Icon before text
   */
  startIcon?: React.ReactNode;

  /**
   * Icon after text
   */
  endIcon?: React.ReactNode;

  /**
   * Button children (text/content)
   */
  children: React.ReactNode;

  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * URL to link to (makes button render as an anchor tag)
   */
  href?: string;

  /**
   * Link target (when href is used)
   */
  target?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      startIcon,
      endIcon,
      children,
      className,
      type = 'button',
      href,
      target,
      ...props
    },
    ref
  ) => {
    // すべてのスタイルはCSS Modulesで管理
    const buttonClassName = clsx(
      styles.button,
      styles[`button--${variant}`],
      styles[`button--${size}`],
      disabled && styles['button--disabled'],
      loading && styles['button--loading'],
      fullWidth && styles['button--full-width']
    );

    const LoadingSpinner = () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          animation: 'spin 1s linear infinite'
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="31.416"
          style={{
            animation: 'dash 2s ease-in-out infinite'
          }}
        />
        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes dash {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
          }
        `}
        </style>
      </svg>
    );

    const commonProps = {
      className: clsx(buttonClassName, className)
    };

    const content = (
      <>
        {loading && <LoadingSpinner />}
        {!loading && startIcon && <span className={styles.button__startIcon}>{startIcon}</span>}
        <span className={styles.button__content}>{children}</span>
        {!loading && endIcon && <span className={styles.button__endIcon}>{endIcon}</span>}
      </>
    );

    if (href) {
      return (
        <a ref={ref as any} href={href} target={target} {...commonProps} {...(props as any)}>
          {content}
        </a>
      );
    }

    return (
      <button ref={ref} type={type} disabled={disabled || loading} {...commonProps} {...props}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
