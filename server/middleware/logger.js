/**
 * Request logging middleware
 */

export const logger = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log request
    console.log(`${timestamp} - ${req.method} ${req.originalUrl} - ${req.ip}`);
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const duration = Date.now() - start;
        const size = res.get('Content-Length') || (chunk ? chunk.length : 0);
        
        console.log(`${timestamp} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${size}bytes`);
        
        originalEnd.call(res, chunk, encoding);
    };
    
    next();
};