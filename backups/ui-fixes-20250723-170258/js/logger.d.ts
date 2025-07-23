/**
 * Frontend Logger TypeScript Definitions
 * フロントエンドロガー型定義
 */

export interface LoggerConfiguration {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  environment?: 'development' | 'staging' | 'production';
  apiEndpoint?: string;
  bufferEnabled?: boolean;
  bufferSize?: number;
  bufferInterval?: number;
  sendToServer?: boolean;
  throttleWindow?: number;
}

export interface LogMetadata {
  [key: string]: any;
  category?: string;
  userId?: string;
  sessionId?: string;
  error?: string;
  stack?: string;
  duration?: number;
  status?: number;
  method?: string;
  url?: string;
  operation?: string;
  action?: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  sessionId: string;
  userId?: string;
  environment: string;
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  [key: string]: any;
}

export interface FrontendLogger {
  // Core logging methods
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;

  // Specialized logging methods
  userAction(action: string, details?: LogMetadata): void;
  performance(operation: string, duration: number, details?: LogMetadata): void;
  apiCall(
    method: string,
    url: string,
    duration: number,
    status: number,
    details?: LogMetadata
  ): void;
  navigation(from: string, to: string, details?: LogMetadata): void;

  // Configuration methods
  setUserId(userId: string | null): void;

  // Debug methods
  getStoredLogs(date?: string): LogEntry[];
  exportLogs(days?: number): LogEntry[];
  clearLogs(): void;

  // Lifecycle methods
  destroy(): void;
}

// Global logger instance
declare global {
  interface Window {
    Logger: FrontendLogger;
    APP_CONFIG?: {
      environment: string;
      apiEndpoint: string;
      enableLogging: boolean;
    };
  }
}

export default FrontendLogger;
