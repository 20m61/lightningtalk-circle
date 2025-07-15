import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './Toast.module.css';

export interface ToastProps {
  /** トーストのID */
  id: string;
  /** メッセージ内容 */
  message: string;
  /** トーストの種類 */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** 表示時間（ミリ秒） */
  duration?: number;
  /** 閉じるボタンの表示 */
  closable?: boolean;
  /** 閉じる時のコールバック */
  onClose?: (id: string) => void;
  /** アクションボタン */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** アイコン */
  icon?: React.ReactNode;
  /** アニメーション有効化 */
  animated?: boolean;
  /** 位置 */
  position?:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  closable = true,
  onClose,
  action,
  icon,
  animated = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Appear animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss
    let dismissTimer: NodeJS.Timeout;
    if (duration > 0) {
      dismissTimer = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(showTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={clsx(
        styles.toast,
        styles[type],
        animated && styles.animated,
        isVisible && styles.visible,
        isLeaving && styles.leaving
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.iconWrapper}>{icon || getDefaultIcon()}</div>

      <div className={styles.content}>
        <p className={styles.message}>{message}</p>

        {action && (
          <button className={styles.actionButton} onClick={action.onClick} type="button">
            {action.label}
          </button>
        )}
      </div>

      {closable && (
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="閉じる"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path
              d="M13 1L1 13M1 1l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {duration > 0 && (
        <div
          className={styles.progressBar}
          style={{
            animationDuration: `${duration}ms`
          }}
        />
      )}
    </div>
  );
};

// Toast Container Component
export interface ToastContainerProps {
  /** トーストのリスト */
  toasts: ToastProps[];
  /** 表示位置 */
  position?: ToastProps['position'];
  /** トースト削除時のコールバック */
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  onRemove
}) => {
  return (
    <div
      className={clsx(styles.container, styles[position])}
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={onRemove} />
      ))}
    </div>
  );
};

// Toast Hook
export interface UseToastReturn {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts
  };
};
