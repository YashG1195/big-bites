import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for Node.js.
 * Must be called BEFORE anything else in server.js.
 */
export const initSentry = () => {
  if (!process.env.SENTRY_DSN) {
    console.log('[Sentry] No DSN found, skipping initialization.');
    return;
  }
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    environment: process.env.NODE_ENV || 'development',
    release: `big-bites-backend@1.0.0`,
    tracesSampleRate: 0.2,
  });
  console.log('[Sentry] Node SDK initialized.');
};

/**
 * Express request handler — must be first middleware.
 * Works as a no-op if Sentry wasn't initialized (no DSN).
 */
export const sentryRequestHandler = (req, res, next) => {
  if (!process.env.SENTRY_DSN) return next();
  return Sentry.Handlers.requestHandler()(req, res, next);
};

/**
 * Express tracing middleware — goes right after requestHandler.
 */
export const sentryTracingHandler = (req, res, next) => {
  if (!process.env.SENTRY_DSN) return next();
  return Sentry.Handlers.tracingHandler()(req, res, next);
};

/**
 * Express error handler — must be placed BEFORE your own error handler.
 * Captures all unhandled Express errors.
 */
export const sentryErrorHandler = (err, req, res, next) => {
  if (!process.env.SENTRY_DSN) return next(err);
  return Sentry.Handlers.errorHandler()(err, req, res, next);
};

/**
 * Set Sentry user context after authentication.
 */
export const setSentryUser = (user) => {
  if (!process.env.SENTRY_DSN) return;
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id:    user._id?.toString() ?? user.uid,
    phone: user.phone,
    name:  user.name,
  });
};

export { Sentry };
