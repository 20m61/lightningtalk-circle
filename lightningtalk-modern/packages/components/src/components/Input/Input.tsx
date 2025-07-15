/**
 * Input Component
 *
 * Flexible input component with validation support and Lightning Talk specific features
 */

import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import styles from './Input.module.css';

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

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
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
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value || '');

    const currentValue = value !== undefined ? value : internalValue;
    const hasError = Boolean(error);
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
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) onBlur(e);
    };

    // CSS Modules classes
    const containerClass = clsx(styles.container, containerClassName);
    const labelClass = clsx(styles.label, hasError && styles['label--error']);
    const inputClass = clsx(
      styles.input,
      styles[`input--${size}`],
      styles[`input--${variant}`],
      hasError && styles['input--error'],
      startIcon && styles['input--has-start-icon'],
      (endIcon || loading) && styles['input--has-end-icon'],
      className
    );
    const startIconClass = clsx(
      styles['start-icon'],
      styles[`start-icon--${size}`],
      hasError && styles['start-icon--error']
    );
    const endIconClass = clsx(
      styles['end-icon'],
      styles[`end-icon--${size}`],
      hasError && styles['end-icon--error']
    );
    const helperTextClass = clsx(
      styles['helper-text'],
      hasError ? styles['helper-text--error'] : styles['helper-text--normal']
    );

    // Loading spinner component
    const LoadingSpinner = () => (
      <div className={clsx(endIconClass, styles['loading-spinner'])}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    );

    return (
      <div className={containerClass}>
        {/* Label */}
        {label && (
          <label className={labelClass}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        {/* Input wrapper */}
        <div className={styles.wrapper}>
          {/* Start icon */}
          {startIcon && <div className={startIconClass}>{startIcon}</div>}

          {/* Input */}
          <input
            ref={ref}
            className={inputClass}
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
            <div className={endIconClass}>{endIcon}</div>
          ) : null}
        </div>

        {/* Helper text and character count */}
        {(helperText || error || showCharCount) && (
          <div className={helperTextClass}>
            <span>{error || helperText}</span>
            {showCharCount && (
              <span>
                {charCount}
                {maxLength && `/${maxLength}`}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
