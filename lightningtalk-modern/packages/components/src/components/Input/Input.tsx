/**
 * Input Component
 * 
 * Flexible input component with validation support and Lightning Talk specific features
 */

import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { colors, spacing, radii, transitions } from '../../tokens';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input label
   */
  label?: string;
  
  /**
   * Helper text displayed below the input
   */
  helperText?: string;
  
  /**
   * Error message (shows error state)
   */
  error?: string;
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Visual variant
   */
  variant?: 'default' | 'outlined' | 'filled';
  
  /**
   * Whether the input is required
   */
  required?: boolean;
  
  /**
   * Whether to show character count
   */
  showCharCount?: boolean;
  
  /**
   * Maximum character count
   */
  maxLength?: number;
  
  /**
   * Left icon or element
   */
  startIcon?: React.ReactNode;
  
  /**
   * Right icon or element
   */
  endIcon?: React.ReactNode;
  
  /**
   * Loading state
   */
  loading?: boolean;
  
  /**
   * Custom CSS class
   */
  className?: string;
  
  /**
   * Container className
   */
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  size = 'md',
  variant = 'outlined',
  required = false,
  showCharCount = false,
  maxLength,
  startIcon,
  endIcon,
  loading = false,
  className,
  containerClassName,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  
  const currentValue = value !== undefined ? value : internalValue;
  const hasError = Boolean(error);
  const hasValue = Boolean(currentValue);
  const charCount = String(currentValue).length;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (value === undefined) {
      setInternalValue(newValue);
    }
    if (onChange) {
      onChange(e);
    }
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };
  
  // Size styles
  const sizeStyles = {
    sm: {
      height: '32px',
      padding: '6px 12px',
      fontSize: '0.875rem',
      iconSize: '16px',
    },
    md: {
      height: '40px',
      padding: '8px 16px',
      fontSize: '1rem',
      iconSize: '20px',
    },
    lg: {
      height: '48px',
      padding: '12px 20px',
      fontSize: '1.125rem',
      iconSize: '24px',
    },
  };
  
  const currentSizeStyles = sizeStyles[size];
  
  // Container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  };
  
  // Label styles
  const labelStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: hasError ? colors.error[600] : colors.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
  };
  
  // Input wrapper styles
  const inputWrapperStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };
  
  // Base input styles
  const baseInputStyles: React.CSSProperties = {
    width: '100%',
    height: currentSizeStyles.height,
    padding: currentSizeStyles.padding,
    fontSize: currentSizeStyles.fontSize,
    fontFamily: 'inherit',
    borderRadius: radii.input,
    transition: transitions.input,
    outline: 'none',
    color: colors.text.primary,
    backgroundColor: 'transparent',
    
    // Padding adjustments for icons
    ...(startIcon && {
      paddingLeft: `calc(${currentSizeStyles.padding.split(' ')[1]} + ${currentSizeStyles.iconSize} + ${spacing[2]})`,
    }),
    ...(endIcon && {
      paddingRight: `calc(${currentSizeStyles.padding.split(' ')[1]} + ${currentSizeStyles.iconSize} + ${spacing[2]})`,
    }),
    
    // Placeholder styles
    '::placeholder': {
      color: colors.text.placeholder,
    },
    
    // Disabled styles
    ...(props.disabled && {
      opacity: 0.6,
      cursor: 'not-allowed',
    }),
  };
  
  // Variant styles
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      border: `1px solid ${hasError ? colors.error[500] : colors.border.medium}`,
      backgroundColor: colors.background.primary,
      
      ':focus': {
        borderColor: hasError ? colors.error[500] : colors.primary[500],
        boxShadow: hasError 
          ? `0 0 0 1px ${colors.error[500]}`
          : `0 0 0 1px ${colors.primary[500]}`,
      },
    },
    
    outlined: {
      border: `1px solid ${hasError ? colors.error[500] : isFocused ? colors.primary[500] : colors.border.medium}`,
      backgroundColor: colors.background.primary,
      boxShadow: hasError 
        ? `0 0 0 1px ${colors.error[500]}`
        : isFocused 
          ? `0 0 0 1px ${colors.primary[500]}`
          : 'none',
    },
    
    filled: {
      border: `1px solid transparent`,
      backgroundColor: hasError ? colors.error[50] : colors.background.secondary,
      
      ':focus': {
        backgroundColor: colors.background.primary,
        borderColor: hasError ? colors.error[500] : colors.primary[500],
        boxShadow: hasError 
          ? `0 0 0 1px ${colors.error[500]}`
          : `0 0 0 1px ${colors.primary[500]}`,
      },
    },
  };
  
  const inputStyles: React.CSSProperties = {
    ...baseInputStyles,
    ...variantStyles[variant],
  };
  
  // Icon styles
  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: currentSizeStyles.iconSize,
    height: currentSizeStyles.iconSize,
    color: hasError ? colors.error[500] : colors.text.secondary,
    pointerEvents: 'none',
    zIndex: 1,
  };
  
  const startIconStyles: React.CSSProperties = {
    ...iconStyles,
    left: currentSizeStyles.padding.split(' ')[1],
  };
  
  const endIconStyles: React.CSSProperties = {
    ...iconStyles,
    right: currentSizeStyles.padding.split(' ')[1],
  };
  
  // Helper/error text styles
  const helperTextStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: hasError ? colors.error[600] : colors.text.secondary,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  
  // Loading spinner
  const LoadingSpinner = () => (
    <div
      style={{
        ...endIconStyles,
        animation: 'spin 1s linear infinite',
      }}
    >
      <svg
        width={currentSizeStyles.iconSize}
        height={currentSizeStyles.iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
    </div>
  );
  
  return (
    <div
      className={clsx('lt-input-container', containerClassName)}
      style={containerStyles}
    >
      {/* Label */}
      {label && (
        <label
          className="lt-input__label"
          style={labelStyles}
        >
          {label}
          {required && (
            <span style={{ color: colors.error[500] }}>*</span>
          )}
        </label>
      )}
      
      {/* Input wrapper */}
      <div
        className="lt-input__wrapper"
        style={inputWrapperStyles}
      >
        {/* Start icon */}
        {startIcon && (
          <div
            className="lt-input__start-icon"
            style={startIconStyles}
          >
            {startIcon}
          </div>
        )}
        
        {/* Input */}
        <input
          ref={ref}
          className={clsx(
            'lt-input',
            `lt-input--${size}`,
            `lt-input--${variant}`,
            {
              'lt-input--error': hasError,
              'lt-input--focused': isFocused,
              'lt-input--has-value': hasValue,
              'lt-input--has-start-icon': !!startIcon,
              'lt-input--has-end-icon': !!endIcon || loading,
            },
            className
          )}
          style={inputStyles}
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          {...props}
        />
        
        {/* End icon or loading */}
        {loading ? (
          <LoadingSpinner />
        ) : endIcon ? (
          <div
            className="lt-input__end-icon"
            style={endIconStyles}
          >
            {endIcon}
          </div>
        ) : null}
      </div>
      
      {/* Helper text and character count */}
      {(helperText || error || showCharCount) && (
        <div
          className="lt-input__helper-text"
          style={helperTextStyles}
        >
          <span>
            {error || helperText}
          </span>
          {showCharCount && (
            <span>
              {charCount}{maxLength && `/${maxLength}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };