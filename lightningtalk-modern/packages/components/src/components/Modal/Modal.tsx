/**
 * Modal Component
 *
 * Accessible modal dialog component for Lightning Talk applications
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import styles from './Modal.module.css';
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
      container
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
        }, 10);

        return () => clearTimeout(timer);
      } else {
        // Return focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
        return;
      }
    }, [open]);

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

    if (!open) return null;

    const modalContent = (
      <div
        className={clsx(styles.backdrop, backdropClassName)}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          ref={modalRef}
          className={clsx(styles.modal, styles[`modal--${size}`], className)}
          role="document"
        >
          {/* Close button */}
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={styles['close-button'] || ''}
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
            <div className={styles.header}>
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
            </div>
          )}

          {/* Body */}
          <div className={clsx(styles.body, contentClassName)}>{children}</div>

          {/* Footer */}
          {footer && <div className={styles.footer}>{footer}</div>}
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
      <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
};

export { Modal };
