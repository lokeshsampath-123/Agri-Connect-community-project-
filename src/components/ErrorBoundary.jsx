'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-error-container/10 border border-error/20 rounded-[2rem]">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">emergency</span>
          </div>
          <h4 className="text-xl font-bold text-error mb-2">Something went wrong</h4>
          <p className="text-sm text-on-surface-variant max-w-md mb-6">
            An error occurred while rendering this module. We have activated fallback safety mode.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Retry Loading
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
