/**
 * Production Logger Utility
 * 本番環境対応のロガーユーティリティ
 */

export function createLogger(moduleName) {
  const prefix = `[${moduleName}]`;
  const isProduction = process.env.NODE_ENV === 'production';

  const formatMessage = (level, message, ...args) => {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + JSON.stringify(args) : '';
    return `${timestamp} ${prefix} ${level}: ${message}${formattedArgs}`;
  };

  return {
    info: (message, ...args) => {
      if (isProduction) {
        // In production, write structured logs to stdout
        process.stdout.write(formatMessage('INFO', message, ...args) + '\n');
      } else {
        console.log(`${prefix} INFO:`, message, ...args);
      }
    },

    error: (message, ...args) => {
      if (isProduction) {
        // In production, write structured logs to stderr
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

// Middleware for Express logging
export const logger = (req, res, next) => {
  const start = Date.now();
  const requestLogger = createLogger('http');

  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    if (res.statusCode >= 400) {
      requestLogger.error(message);
    } else {
      requestLogger.info(message);
    }
  });

  next();
};