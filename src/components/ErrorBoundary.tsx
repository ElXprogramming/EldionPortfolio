import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // In production, log generic error without leaking sensitive internals
    console.error('ErrorBoundary caught an error:', error.message, errorInfo.componentStack);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] p-8 flex flex-col items-center justify-center text-center bg-zinc-950/60 border border-white/10 rounded-2xl m-4">
          <p className="text-sm font-semibold text-purple-300 mb-2">
            {this.props.fallbackTitle ?? 'Component temporarily unavailable'}
          </p>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            An unexpected display issue occurred while rendering this section.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
