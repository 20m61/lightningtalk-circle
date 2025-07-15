/**
 * Card Component
 *
 * Flexible card container for displaying content with consistent styling
 */

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { colors, spacing, radii } from '../../tokens';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style variant
   */
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost' | 'highlighted';

  /**
   * Padding size
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Whether the card is interactive (clickable)
   */
  interactive?: boolean;

  /**
   * Whether the card is selected/active
   */
  selected?: boolean;

  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Optional click handler (makes card interactive)
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;

  /**
   * Card title (renders header)
   */
  title?: string;

  /**
   * Card subtitle
   */
  subtitle?: string;

  /**
   * Footer content
   */
  footer?: React.ReactNode;

  /**
   * Image source
   */
  image?: string;

  /**
   * Image alt text
   */
  imageAlt?: string;

  /**
   * Elevation level (0-4)
   */
  elevation?: number;

  /**
   * Whether card is clickable (for testing compatibility)
   */
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      interactive = false,
      selected = false,
      className,
      children,
      onClick,
      title,
      subtitle,
      footer,
      image,
      imageAlt,
      elevation,
      clickable,
      ...props
    },
    ref
  ) => {
    const isInteractive = interactive || clickable || !!onClick;

    // すべてのスタイルはCSS Modulesで管理
    const cardClassName = clsx(
      styles.card,
      styles[`card--${variant}`],
      styles[`card--padding-${padding}`],
      isInteractive && styles['card--interactive'],
      selected && styles['card--selected'],
      elevation && styles[`card--elevation-${elevation}`]
    );

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (onClick) {
        onClick(event);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        handleClick(event as any);
      }
    };

    return (
      <div
        ref={ref}
        className={clsx(cardClassName, className)}
        onClick={isInteractive ? handleClick : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        role={isInteractive ? 'button' : undefined}
        {...props}
      >
        {image && (
          <img
            src={image}
            alt={imageAlt || ''}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: `${radii.card} ${radii.card} 0 0`,
              marginBottom: spacing[3]
            }}
          />
        )}

        {title && (
          <div style={{ marginBottom: spacing[3] }}>
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1.4,
                color: colors.text.primary,
                margin: 0
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: colors.text.secondary,
                  marginTop: spacing[1],
                  margin: 0
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}

        {footer && (
          <div
            style={{
              marginTop: spacing[4],
              paddingTop: spacing[4],
              borderTop: `1px solid ${colors.border.light}`
            }}
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => {
    const headerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing[4]
    };

    const titleStyles: React.CSSProperties = {
      flex: 1
    };

    const titleTextStyles: React.CSSProperties = {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: colors.text.primary,
      margin: 0
    };

    const subtitleTextStyles: React.CSSProperties = {
      fontSize: '0.875rem',
      color: colors.text.secondary,
      marginTop: spacing[1],
      margin: 0
    };

    return (
      <div ref={ref} className={clsx('lt-card__header', className)} style={headerStyles} {...props}>
        <div style={titleStyles}>
          {title && <h3 style={titleTextStyles}>{title}</h3>}
          {subtitle && <p style={subtitleTextStyles}>{subtitle}</p>}
          {children}
        </div>
        {action && <div className="lt-card__header-action">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('lt-card__content', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    const footerStyles: React.CSSProperties = {
      marginTop: spacing[4],
      paddingTop: spacing[4],
      borderTop: `1px solid ${colors.border.light}`
    };

    return (
      <div ref={ref} className={clsx('lt-card__footer', className)} style={footerStyles} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card };
