import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a2a3b] to-[#1a3f54] p-4">
          <div className="glass p-8 max-w-lg w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-[#d4af37] mb-4">
              {this.props.t?.('errors.somethingWentWrong') || 'Something went wrong'}
            </h1>
            <p className="text-white/70 mb-6">
              {this.props.t?.('errors.tryAgain') || 'Please try refreshing the page'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              {this.props.t?.('common.refresh') || 'Refresh Page'}
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-500/20 rounded-lg text-left">
                <p className="text-red-300 font-mono text-sm">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;