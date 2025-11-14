import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if this is a third-party script error that we can safely ignore
    const errorMessage = error?.message || '';
    const isThirdPartyError = errorMessage.includes('Script error') || 
                             errorMessage.includes('gtm') || 
                             errorMessage.includes('cookiebot') ||
                             errorMessage.includes('analytics');
    
    if (isThirdPartyError) {
      // Don't show error UI for third-party script failures
      console.warn('Third-party script error caught and ignored:', errorMessage);
      return { hasError: false };
    }
    
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Attempt automatic recovery for certain error types
    const errorMessage = error?.message || '';
    if (errorMessage.includes('Loading chunk') || errorMessage.includes('Failed to fetch')) {
      // Network/chunk loading errors - reload might fix it
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mt-4 p-4 bg-muted rounded-lg">
                <summary className="cursor-pointer font-medium mb-2">Error details</summary>
                <pre className="text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-2 justify-center pt-4">
              <Button onClick={this.handleReset} variant="default">
                Return to Home
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
