function handler(event) {
  var response = event.response;
  var headers = response.headers;

  // Security headers
  headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload' };
  headers['x-content-type-options'] = { value: 'nosniff' };
  headers['x-frame-options'] = { value: 'DENY' };
  headers['x-xss-protection'] = { value: '1; mode=block' };
  headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
  headers['permissions-policy'] = { value: 'geolocation=(self), microphone=(), camera=()' };

  // CSP header
  headers['content-security-policy'] = {
    value:
      "default-src 'self' https://*.amazonaws.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.amazonaws.com wss://*.amazonaws.com"
  };

  return response;
}
