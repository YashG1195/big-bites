import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { COLORS } from '../constants/colors';

/**
 * SentryErrorBoundary
 *
 * Wraps the entire app tree. When a render-phase error is caught:
 *  1. It automatically reports the error + componentStack to Sentry.
 *  2. Shows a user-friendly "Something went wrong" fallback screen
 *     with a retry button that resets the error state.
 *
 * Usage: wrap the Provider in App.js.
 */
class SentryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Capture the error with full context
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack },
      },
    });
    this.setState({ eventId });
  }

  handleRetry = () => {
    this.setState({ hasError: false, eventId: null });
  };

  handleReport = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🍔</Text>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.subtitle}>
            Big Bites ran into an unexpected error. Our team has been notified.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={this.handleRetry}>
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
          {this.state.eventId && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={this.handleReport}>
              <Text style={styles.secondaryBtnText}>Report Feedback</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.errorId}>
            Error ID: {this.state.eventId?.slice(0, 8) ?? 'N/A'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 60, marginBottom: 20 },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: 14 },
  errorId: { color: '#444', fontSize: 10, fontFamily: 'monospace' },
});

export default SentryErrorBoundary;
