/**
 * Logger Utility
 * シンプルなロガーユーティリティ
 */

export function createLogger(moduleName) {
  const prefix = `[${moduleName}]`;

  return {
    info: (message, ...args) => {
      console.log(`${prefix} INFO:`, message, ...args);
    },

    error: (message, ...args) => {
      console.error(`${prefix} ERROR:`, message, ...args);
    },

    warn: (message, ...args) => {
      console.warn(`${prefix} WARN:`, message, ...args);
    },

    debug: (message, ...args) => {
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
        console.debug(`${prefix} DEBUG:`, message, ...args);
      }
    }
  };
}

export default createLogger;
