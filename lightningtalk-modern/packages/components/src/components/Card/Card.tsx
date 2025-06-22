/**
 * Card Component
 * 
 * Flexible card container for displaying content with consistent styling
 */

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { colors, spacing, radii, shadows, transitions } from '../../tokens';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style variant
   */
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost';
  
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
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  interactive = false,
  selected = false,
  className,
  children,
  onClick,
  ...props
}, ref) => {
  const isInteractive = interactive || !!onClick;
  
  const baseStyles: React.CSSProperties = {
    position: 'relative',
    borderRadius: radii.card,
    transition: transitions.cardHover,
    outline: 'none',
    
    // Focus styles for interactive cards
    ...(isInteractive && {
      cursor: 'pointer',
      ':focus-visible': {
        outline: `2px solid ${colors.border.focus}`,
        outlineOffset: '2px',
      },
    }),
  };
  
  const paddingStyles: Record<string, React.CSSProperties> = {
    none: { padding: 0 },
    sm: { padding: spacing.component.cardPadding.sm },
    md: { padding: spacing.component.cardPadding.md },
    lg: { padding: spacing.component.cardPadding.lg },
  };
  
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: colors.background.card,
      border: `1px solid ${colors.border.light}`,
      boxShadow: shadows.xs,
      
      ...(isInteractive && {
        ':hover': {
          borderColor: colors.border.medium,
          boxShadow: shadows.cardHover,
          transform: 'translateY(-1px)',
        },
      }),
    },
    
    outlined: {
      backgroundColor: colors.background.card,
      border: `1px solid ${colors.border.medium}`,
      
      ...(isInteractive && {
        ':hover': {
          borderColor: colors.primary[300],
          boxShadow: shadows.sm,
        },
      }),
    },
    
    elevated: {
      backgroundColor: colors.background.card,
      border: 'none',
      boxShadow: shadows.card,
      
      ...(isInteractive && {
        ':hover': {
          boxShadow: shadows.cardHover,
          transform: 'translateY(-2px)',
        },
      }),
    },
    
    ghost: {
      backgroundColor: 'transparent',
      border: 'none',
      
      ...(isInteractive && {
        ':hover': {
          backgroundColor: colors.background.secondary,
        },
      }),
    },
  };
  
  const selectedStyles: React.CSSProperties = {
    borderColor: colors.primary[500],
    boxShadow: `0 0 0 1px ${colors.primary[500]}, ${shadows.card}`,
  };
  
  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...paddingStyles[padding],
    ...variantStyles[variant],
    ...(selected ? selectedStyles : {}),
  };
  
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
      className={clsx('lt-card', `lt-card--${variant}`, `lt-card--padding-${padding}`, {
        'lt-card--interactive': isInteractive,
        'lt-card--selected': selected,
      }, className)}
      style={combinedStyles}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}, ref) => {
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  };
  
  const titleStyles: React.CSSProperties = {
    flex: 1,
  };
  
  const titleTextStyles: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
    color: colors.text.primary,
    margin: 0,
  };
  
  const subtitleTextStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: colors.text.secondary,
    marginTop: spacing[1],
    margin: 0,
  };
  
  return (
    <div
      ref={ref}
      className={clsx('lt-card__header', className)}
      style={headerStyles}
      {...props}
    >
      <div style={titleStyles}>
        {title && <h3 style={titleTextStyles}>{title}</h3>}
        {subtitle && <p style={subtitleTextStyles}>{subtitle}</p>}
        {children}
      </div>
      {action && (
        <div className="lt-card__header-action">
          {action}
        </div>
      )}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

// Card Content Component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('lt-card__content', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({
  className,
  children,
  ...props
}, ref) => {
  const footerStyles: React.CSSProperties = {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTop: `1px solid ${colors.border.light}`,
  };
  
  return (
    <div
      ref={ref}
      className={clsx('lt-card__footer', className)}
      style={footerStyles}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export { Card };