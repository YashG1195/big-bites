import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry for Node.js.
 * Call this BEFORE anything else in server.js.
 *
 * DSN is loaded from process.env.SENTRY_DSN (set via EAS secrets or .env).
 */
export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    environment: process.env.NODE_ENV || 'development',
    release: `big-bites-backend@${process.env.npm_package_version || '1.0.0'}`,
    integrations: [
      // Automatically instrument http calls and db queries
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
  });
  console.log('[Sentry] Node SDK initialized.');
};

/** Express request handler — must be first middleware */
export const sentryRequestHandler = Sentry.Handlers.requestHandler();

/** Express tracing middleware — goes right after requestHandler */
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();

/**
 * Express error handler — must be LAST middleware, before your own errorHandler.
 * It captures all unhandled Express errors and forwards them to Sentry.
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

/** Set user context on Sentry after authentication. */
export const setSentryUser = (user) => {
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
