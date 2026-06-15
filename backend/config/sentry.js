import * as Sentry from '@sentry/node';

const DSN = process.env.SENTRY_DSN;
const isEnabled = !!DSN && DSN !== 'your_sentry_dsn_here';

/**
 * Initialize Sentry for Node.js (must be called before any other code).
 */
export const initSentry = () => {
  if (!isEnabled) {
    console.log('[Sentry] No DSN configured — skipping initialization.');
    return;
  }
  Sentry.init({
    dsn: DSN,
    enabled: true,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
  console.log('[Sentry] Node SDK initialized.');
};

/**
 * Express middleware — must be FIRST middleware.
 * No-op when Sentry is not configured.
 */
export const sentryRequestHandler = (req, res, next) => next();

/**
 * Express tracing middleware.
 * No-op when Sentry is not configured.
 */
export const sentryTracingHandler = (req, res, next) => next();

/**
 * Express error middleware — must be placed BEFORE your own errorHandler.
 * Captures all Express errors to Sentry when configured.
 */
export const sentryErrorHandler = (err, req, res, next) => {
  if (isEnabled) {
    Sentry.captureException(err);
  }
  next(err);
};

/**
 * Set Sentry user context after authentication.
 */
export const setSentryUser = (user) => {
  if (!isEnabled || !user) return;
  Sentry.setUser({
    id:    user._id?.toString(),
    phone: user.phone,
    name:  user.name,
  });
};

export { Sentry };
