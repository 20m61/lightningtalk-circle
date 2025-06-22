/**
 * Button Component
 * 
 * Accessible, customizable button component for Lightning Talk application
 */

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { colors, spacing, typography, radii, shadows, transitions } from '../../tokens';

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
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
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
  ...props
}, ref) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    fontFamily: typography.fonts.primary,
    fontWeight: typography.weights.medium,
    textDecoration: 'none',
    border: '1px solid transparent',
    borderRadius: radii.button,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: transitions.buttonHover,
    outline: 'none',
    position: 'relative',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    
    // Focus styles
    ':focus-visible': {
      outline: `2px solid ${colors.border.focus}`,
      outlineOffset: '2px',
    },
  };
  
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      fontSize: typography.sizes.sm.mobile,
      lineHeight: typography.lineHeights.normal,
      padding: `${spacing.component.buttonPaddingY.sm} ${spacing.component.buttonPaddingX.sm}`,
      minHeight: '32px',
    },
    md: {
      fontSize: typography.sizes.base.mobile,
      lineHeight: typography.lineHeights.normal,
      padding: `${spacing.component.buttonPaddingY.md} ${spacing.component.buttonPaddingX.md}`,
      minHeight: '40px',
    },
    lg: {
      fontSize: typography.sizes.lg.mobile,
      lineHeight: typography.lineHeights.normal,
      padding: `${spacing.component.buttonPaddingY.lg} ${spacing.component.buttonPaddingX.lg}`,
      minHeight: '48px',
    },
  };
  
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.primary[500],
      borderColor: colors.primary[500],
      color: colors.text.inverse,
      boxShadow: shadows.button,
      
      ':hover': {
        backgroundColor: colors.primary[600],
        borderColor: colors.primary[600],
        boxShadow: shadows.buttonHover,
      },
      
      ':active': {
        backgroundColor: colors.primary[700],
        borderColor: colors.primary[700],
      },
    },
    
    secondary: {
      backgroundColor: colors.secondary[500],
      borderColor: colors.secondary[500],
      color: colors.text.inverse,
      boxShadow: shadows.button,
      
      ':hover': {
        backgroundColor: colors.secondary[600],
        borderColor: colors.secondary[600],
        boxShadow: shadows.buttonHover,
      },
      
      ':active': {
        backgroundColor: colors.secondary[700],
        borderColor: colors.secondary[700],
      },
    },
    
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.primary[500],
      color: colors.primary[500],
      
      ':hover': {
        backgroundColor: colors.primary[50],
        borderColor: colors.primary[600],
        color: colors.primary[600],
      },
      
      ':active': {
        backgroundColor: colors.primary[100],
        borderColor: colors.primary[700],
        color: colors.primary[700],
      },
    },
    
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: colors.primary[500],
      
      ':hover': {
        backgroundColor: colors.primary[50],
        color: colors.primary[600],
      },
      
      ':active': {
        backgroundColor: colors.primary[100],
        color: colors.primary[700],
      },
    },
    
    danger: {
      backgroundColor: colors.error[500],
      borderColor: colors.error[500],
      color: colors.text.inverse,
      boxShadow: shadows.button,
      
      ':hover': {
        backgroundColor: colors.error[600],
        borderColor: colors.error[600],
        boxShadow: shadows.buttonHover,
      },
      
      ':active': {
        backgroundColor: colors.error[700],
        borderColor: colors.error[700],
      },
    },
  };
  
  const disabledStyles: React.CSSProperties = {
    opacity: 0.6,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  };
  
  const fullWidthStyles: React.CSSProperties = {
    width: '100%',
  };
  
  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(disabled || loading ? disabledStyles : {}),
    ...(fullWidth ? fullWidthStyles : {}),
  };
  
  const LoadingSpinner = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: 'spin 1s linear infinite',
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
          animation: 'dash 2s ease-in-out infinite',
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
  
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={clsx('lt-button', `lt-button--${variant}`, `lt-button--${size}`, {
        'lt-button--loading': loading,
        'lt-button--full-width': fullWidth,
        'lt-button--disabled': disabled,
      }, className)}
      style={combinedStyles}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && startIcon && <span className="lt-button__start-icon">{startIcon}</span>}
      <span className="lt-button__content">{children}</span>
      {!loading && endIcon && <span className="lt-button__end-icon">{endIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };