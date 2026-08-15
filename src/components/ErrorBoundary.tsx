import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  isChunkLoadError: boolean;
}

/**
 * Without this, ANY uncaught error thrown while rendering ANY component --
 * anywhere in the app -- takes down the entire React tree to a blank white
 * page with no explanation. That's very likely what "clicking ORM Command
 * Center closes the app" actually was: this app is code-split
 * (React.lazy() per tab), and every production build gives each chunk a new
 * content-hash filename (e.g. DashboardView-DEwaLAtv.js). If a browser tab
 * was already open from BEFORE a redeploy and the person then clicks into a
 * tab for the first time, React tries to fetch that tab's chunk using the
 * OLD filename baked into the OLD index.html still sitting in that tab --
 * which no longer exists on the server after the new deploy replaced it.
 * That fetch fails, React throws, and with no error boundary the whole app
 * goes blank. This is a well-known SPA/code-splitting gotcha, not specific
 * to this app's business logic.
 *
 * This boundary catches that (and any other render crash) and shows a
 * recoverable screen instead of a blank one -- specifically detecting the
 * stale-chunk case and prompting a refresh, since that's self-healing.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  declare props: { children: React.ReactNode };
  state: ErrorBoundaryState = { hasError: false, isChunkLoadError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const message = error?.message || '';
    const isChunkLoadError =
      /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|dynamically imported module/i.test(message);
    return { hasError: true, isChunkLoadError };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught a render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-serif font-bold text-white">
              {this.state.isChunkLoadError ? 'A New Version Is Available' : 'Something Went Wrong'}
            </h1>
            <p className="text-sm text-slate-400">
              {this.state.isChunkLoadError
                ? "This tab was open from before the site's last update, so it couldn't load the page you clicked. Refreshing will fix this."
                : 'The page hit an unexpected error. Refreshing usually resolves this -- if it keeps happening on the same action, let the team know what you were doing.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg"
            >
              <RefreshCw size={16} />
              <span>Refresh the Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
