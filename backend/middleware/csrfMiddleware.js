const crypto = require('crypto');

// Security fix: Implement CSRF protection for state-changing operations
// Since csurf is deprecated, implementing a simple token-based CSRF protection

// Store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(token);
    }
  }
}, 60000); // Clean up every minute

// Generate CSRF token
const generateCSRFToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour

  csrfTokens.set(token, {
    sessionId,
    expires
  });

  return token;
};

// Validate CSRF token
const validateCSRFToken = (token, sessionId) => {
  const tokenData = csrfTokens.get(token);

  if (!tokenData) {
    return false;
  }

  // Check if token is expired
  if (tokenData.expires < Date.now()) {
    csrfTokens.delete(token);
    return false;
  }

  // Check if token belongs to the correct session
  if (tokenData.sessionId !== sessionId) {
    return false;
  }

  // Token is valid, remove it (one-time use)
  csrfTokens.delete(token);
  return true;
};

// Middleware to provide CSRF token
const csrfToken = (req, res, next) => {
  // For authenticated users, use user ID as session identifier
  // For unauthenticated requests, skip CSRF (they should use other auth methods)
  if (!req.user) {
    return next();
  }

  const sessionId = req.user.id.toString();
  const token = generateCSRFToken(sessionId);

  // Add token to response headers
  res.set('X-CSRF-Token', token);

  // Also add to response body for convenience
  res.locals.csrfToken = token;

  next();
};

// Middleware to validate CSRF token for state-changing operations
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For authenticated users, require CSRF token
  if (req.user) {
    const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;

    if (!token) {
      return res.status(403).json({
        message: 'CSRF token missing. Include X-CSRF-Token header or _csrf in request body.'
      });
    }

    const sessionId = req.user.id.toString();
    if (!validateCSRFToken(token, sessionId)) {
      return res.status(403).json({
        message: 'Invalid or expired CSRF token.'
      });
    }
  }

  next();
};

module.exports = {
  csrfToken,
  csrfProtection
};