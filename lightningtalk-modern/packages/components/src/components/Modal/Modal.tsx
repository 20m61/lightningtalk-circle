/**
 * Modal Component
 *
 * Accessible modal dialog component for Lightning Talk applications
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { colors, spacing, radii, shadows } from '../../tokens';
import { Button } from '../Button';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal should be closed
   */
  onClose: () => void;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Modal size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Whether to show close button
   */
  showCloseButton?: boolean;

  /**
   * Whether clicking backdrop closes modal
   */
  closeOnBackdropClick?: boolean;

  /**
   * Whether pressing Escape closes modal
   */
  closeOnEscape?: boolean;

  /**
   * Custom CSS class for modal
   */
  className?: string;

  /**
   * Custom CSS class for backdrop
   */
  backdropClassName?: string;

  /**
   * Custom CSS class for content
   */
  contentClassName?: string;

  /**
   * Modal content
   */
  children: React.ReactNode;

  /**
   * Footer content (typically buttons)
   */
  footer?: React.ReactNode;

  /**
   * Whether to prevent body scroll when modal is open
   */
  preventBodyScroll?: boolean;

  /**
   * Custom portal container
   */
  container?: HTMLElement;

  /**
   * Callback when modal is fully opened
   */
  onAfterOpen?: () => void;

  /**
   * Callback when modal is fully closed
   */
  onAfterClose?: () => void;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      size = 'md',
      showCloseButton = true,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      className,
      backdropClassName,
      contentClassName,
      children,
      footer,
      preventBodyScroll = true,
      container,
      onAfterOpen,
      onAfterClose
    },
    _ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Handle body scroll prevention
    useEffect(() => {
      if (!preventBodyScroll) return;

      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open, preventBodyScroll]);

    // Handle focus management
    useEffect(() => {
      if (open) {
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Focus the modal after a brief delay to ensure it's rendered
        const timer = setTimeout(() => {
          if (modalRef.current) {
            const focusableElement = modalRef.current.querySelector<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            focusableElement?.focus();
          }
          onAfterOpen?.();
        }, 10);

        return () => clearTimeout(timer);
      } else {
        // Return focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
        onAfterClose?.();
        return;
      }
    }, [open, onAfterOpen, onAfterClose]);

    // Handle escape key
    useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, closeOnEscape, onClose]);

    // Handle backdrop click
    const handleBackdropClick = (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    };

    // Handle focus trap
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    if (!open) return null;

    // Size configurations
    const sizeStyles = {
      sm: { maxWidth: '400px', margin: '5vh auto' },
      md: { maxWidth: '500px', margin: '5vh auto' },
      lg: { maxWidth: '700px', margin: '5vh auto' },
      xl: { maxWidth: '900px', margin: '5vh auto' },
      full: {
        maxWidth: '95vw',
        maxHeight: '95vh',
        margin: '2.5vh auto',
        width: '95vw',
        height: '95vh'
      }
    };

    // Backdrop styles
    const backdropStyles: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: spacing[4],
      overflow: 'auto',
      backdropFilter: 'blur(4px)'
    };

    // Modal content styles
    const modalStyles: React.CSSProperties = {
      backgroundColor: colors.background.primary,
      borderRadius: radii.modal,
      boxShadow: shadows.modal,
      position: 'relative',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...sizeStyles[size]
    };

    // Header styles
    const headerStyles: React.CSSProperties = {
      padding: `${spacing[6]} ${spacing[6]} ${spacing[4]} ${spacing[6]}`,
      borderBottom: `1px solid ${colors.border.light}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0
    };

    // Title styles
    const titleStyles: React.CSSProperties = {
      margin: 0,
      fontSize: '1.25rem',
      fontWeight: 600,
      color: colors.text.primary,
      lineHeight: 1.4
    };

    // Body styles
    const bodyStyles: React.CSSProperties = {
      padding: spacing[6],
      flex: 1,
      overflow: 'auto'
    };

    // Footer styles
    const footerStyles: React.CSSProperties = {
      padding: `${spacing[4]} ${spacing[6]} ${spacing[6]} ${spacing[6]}`,
      borderTop: `1px solid ${colors.border.light}`,
      display: 'flex',
      gap: spacing[3],
      justifyContent: 'flex-end',
      flexShrink: 0
    };

    // Close button styles
    const closeButtonStyles: React.CSSProperties = {
      position: 'absolute',
      top: spacing[4],
      right: spacing[4],
      zIndex: 1
    };

    const modalContent = (
      <div
        className={clsx('lt-modal-backdrop', backdropClassName)}
        style={backdropStyles}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          ref={modalRef}
          className={clsx('lt-modal', `lt-modal--${size}`, className)}
          style={modalStyles}
          onKeyDown={handleKeyDown}
          role="document"
        >
          {/* Close button */}
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              style={closeButtonStyles}
              aria-label="Close modal"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          )}

          {/* Header */}
          {title && (
            <div className="lt-modal__header" style={headerStyles}>
              <h2 id="modal-title" style={titleStyles}>
                {title}
              </h2>
            </div>
          )}

          {/* Body */}
          <div className={clsx('lt-modal__body', contentClassName)} style={bodyStyles}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="lt-modal__footer" style={footerStyles}>
              {footer}
            </div>
          )}
        </div>
      </div>
    );

    // Render to portal
    const portalContainer = container || document.body;
    return createPortal(modalContent, portalContainer);
  }
);

Modal.displayName = 'Modal';

// Confirmation Modal Component
export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false
}: ConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: colors.text.secondary, lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
};

export { Modal };
