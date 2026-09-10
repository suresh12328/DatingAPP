import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-zinc-900/60 rounded-3xl border border-zinc-800 my-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-extrabold text-zinc-100 font-heading mb-2">
            {this.props.fallbackTitle || 'Something unexpected occurred'}
          </h3>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            {this.props.fallbackMessage ||
              'We encountered a temporary hiccup loading this view. You can safely refresh the component or return to the feed.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry & Reload</span>
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700/60 transition"
            >
              <Home className="w-4 h-4" />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
