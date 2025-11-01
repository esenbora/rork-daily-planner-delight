import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react-native';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log to Firebase Crashlytics in production
    if (process.env.EXPO_PUBLIC_APP_ENVIRONMENT === 'production') {
      // Firebase Crashlytics will be added here
      console.error('ErrorBoundary caught:', error, errorInfo);
    } else {
      // Development: log to console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  reloadApp = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Failed to reload app:', error);
      // Fallback: just reset the error state
      this.resetError();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color="#C75B6E" strokeWidth={1.5} />
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.resetError}
              >
                <RefreshCcw size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={this.reloadApp}
              >
                <Home size={20} color="#8B7AC7" />
                <Text style={styles.secondaryButtonText}>Restart App</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.support}>
              If this problem persists, please contact{'\n'}
              support@dailyplannerdelight.app
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(199, 91, 110, 0.1)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(199, 91, 110, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C75B6E',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B7AC7',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 122, 199, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#8B7AC7',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B7AC7',
  },
  support: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
});

export default ErrorBoundary;
