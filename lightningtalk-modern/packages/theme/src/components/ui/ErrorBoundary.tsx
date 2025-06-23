/**
 * Error Boundary Component
 * React エラーをキャッチして適切に表示するコンポーネント
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // エラーレポートの送信（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // WordPress Ajax を使用してエラーレポートを送信
    const wpData = window.wpLightningTalk;
    if (wpData && wpData.ajaxUrl) {
      fetch(wpData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'lightningtalk_log_error',
          nonce: wpData.nonce,
          error: error.message,
          stack: error.stack || '',
          component_stack: errorInfo.componentStack,
          url: window.location.href,
          user_agent: navigator.userAgent
        })
      }).catch(reportError => {
        console.error('Failed to report error:', reportError);
      });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>エラーが発生しました</h2>
            <p>申し訳ございませんが、予期しないエラーが発生しました。</p>
            
            <div className="error-actions">
              <button 
                className="btn btn-primary" 
                onClick={this.handleRetry}
              >
                再試行
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => window.location.reload()}
              >
                ページを再読み込み
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>エラー詳細（開発モード）</summary>
                <pre className="error-stack">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                  {this.state.errorInfo && '\n\nComponent Stack:'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}