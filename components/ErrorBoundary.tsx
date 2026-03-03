"use client";

import * as React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught a render error", {
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[320px] items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We hit an unexpected error while loading this view. Please try
              again.
            </p>
            <button
              type="button"
              onClick={this.handleTryAgain}
              className="mt-4 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
