/**
 * Loading Spinner Component
 * ローディング状態の表示用コンポーネント
 */

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = '読み込み中...', 
  size = 'medium',
  className = ''
}) => {
  return (
    <div className={`loading-spinner ${size} ${className}`}>
      <div className="spinner">
        <div className="spinner-circle"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};