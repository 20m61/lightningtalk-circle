/**
 * Production Request logging middleware
 */

export const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === 'production';

  const formatLog = data => {
    return isProduction
      ? JSON.stringify(data)
      : `${data.timestamp} - ${data.method} ${data.url} - ${data.ip} - ${data.status || 'START'} - ${data.duration || 0}ms`;
  };

  // Log request start
  const requestLog = {
    timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    type: 'request_start'
  };

  if (isProduction) {
    process.stdout.write(`${formatLog(requestLog)}\n`);
  } else {
    console.log(formatLog(requestLog));
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - start;
    const size = res.get('Content-Length') || (chunk ? chunk.length : 0);

    const responseLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      status: res.statusCode,
      duration,
      size,
      type: 'request_end'
    };

    if (isProduction) {
      process.stdout.write(`${formatLog(responseLog)}\n`);
    } else {
      console.log(formatLog(responseLog));
    }

    originalEnd.call(res, chunk, encoding);
  };

  next();
};
