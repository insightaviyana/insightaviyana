import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { initMonitoring } from './lib/monitoring';
import { initAnalytics } from './lib/analytics';
import './index.css';

initMonitoring();
// No-op until the visitor accepts via CookieConsentBanner (see its
// consent gate in analytics.ts) -- called here too so a returning visitor
// who already accepted on a previous visit doesn't have to see the
// banner again just to get analytics running this session.
initAnalytics();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <CookieConsentBanner />
    </ErrorBoundary>
  </React.StrictMode>
);
