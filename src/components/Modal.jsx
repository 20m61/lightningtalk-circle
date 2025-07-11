import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  className = ''
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = e => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity animate-fade-in"
          aria-hidden="true"
          onClick={closeOnOutsideClick ? onClose : undefined}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={`
            relative transform overflow-hidden rounded-2xl 
            bg-white shadow-2xl transition-all animate-slide-up
            ${sizeClasses[size]} w-full
            ${className}
          `}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    rounded-lg p-1.5 text-gray-400 
                    hover:bg-gray-100 hover:text-gray-500 
                    transition-colors focus:outline-none 
                    focus:ring-2 focus:ring-primary-500
                  "
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};
