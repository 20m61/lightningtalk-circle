import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600 
      text-white shadow-lg shadow-primary-500/25
      hover:from-primary-600 hover:to-primary-700 
      hover:shadow-xl hover:shadow-primary-500/30
      focus:ring-primary-500
    `,
    secondary: `
      bg-gradient-to-r from-secondary-500 to-secondary-600 
      text-white shadow-lg shadow-secondary-500/25
      hover:from-secondary-600 hover:to-secondary-700 
      hover:shadow-xl hover:shadow-secondary-500/30
      focus:ring-secondary-500
    `,
    outline: `
      border-2 border-primary-500 text-primary-600
      hover:bg-primary-50 hover:border-primary-600
      focus:ring-primary-500
    `,
    ghost: `
      text-gray-700 hover:bg-gray-100 
      hover:text-gray-900 focus:ring-gray-500
    `,
    danger: `
      bg-red-600 text-white shadow-lg shadow-red-500/25
      hover:bg-red-700 hover:shadow-xl hover:shadow-red-500/30
      focus:ring-red-500
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${widthClass}
        ${className}
      `}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
};
