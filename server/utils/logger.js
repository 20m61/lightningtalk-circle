/**
 * Production Logger Utility
 * 本番環境対応のロガーユーティリティ
 */

export function createLogger(moduleName) {
  const prefix = `[${moduleName}]`;
  const isProduction = process.env.NODE_ENV === 'production';

  const formatMessage = (level, message, ...args) => {
    const timestamp = new Date().toISOString();
    const formatted = {
      timestamp,
      level,
      module: moduleName,
      message,
      data: args.length > 0 ? args : undefined
    };

    return isProduction ? JSON.stringify(formatted) : `${timestamp} ${prefix} ${level}: ${message}`;
  };

  return {
    info: (message, ...args) => {
      if (isProduction) {
        process.stdout.write(formatMessage('INFO', message, ...args) + '\n');
      } else {
        console.log(`${prefix} INFO:`, message, ...args);
      }
    },

    error: (message, ...args) => {
      if (isProduction) {
        process.stderr.write(formatMessage('ERROR', message, ...args) + '\n');
      } else {
        console.error(`${prefix} ERROR:`, message, ...args);
      }
    },

    warn: (message, ...args) => {
      if (isProduction) {
        process.stderr.write(formatMessage('WARN', message, ...args) + '\n');
      } else {
        console.warn(`${prefix} WARN:`, message, ...args);
      }
    },

    debug: (message, ...args) => {
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
        console.debug(`${prefix} DEBUG:`, message, ...args);
      }
    }
  };
}

export default createLogger;
