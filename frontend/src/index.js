// Silence dev-server websocket error spam in production builds deployed from a dev bundle
if (process.env.NODE_ENV === 'production') {
  const filter = (msg) =>
    typeof msg === 'string' && msg.includes(':8080/ws') && msg.includes('WebSocket');
  const origErr = console.error.bind(console);
  const origWarn = console.warn.bind(console);
  console.error = (...a) => { if (!filter(a[0])) origErr(...a); };
  console.warn  = (...a) => { if (!filter(a[0])) origWarn(...a); };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/theme.css';
import './styles/pageTransitions.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import App from './App';
import * as Sentry from '@sentry/react';


const root = ReactDOM.createRoot(document.getElementById('root'));
AOS.init({ duration: 700, once: true });
// Initialize Sentry with DSN from environment variables
// Note: Set REACT_APP_SENTRY_DSN in .env.local for development
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    // Disable debug logs in development
    debug: false,
    environment: process.env.NODE_ENV,
    release: 'gig-worker-finder@' + (process.env.REACT_APP_VERSION || '1.0.0'),
    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry event captured:', event);
      }
      return event;
    },
    autoSessionTracking: true,
    // Sample 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture Replay for error sessions
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  // Add user context when available
  // Example: Sentry.setUser({ id: '123', email: 'user@example.com' });

  // Development mode logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Sentry initialized in development mode');
    // Uncomment to test error reporting
    // setTimeout(() => {
    //   console.log('Testing Sentry error reporting...');
    //   try {
    //     const testObj = { key: 'value' };
    //     console.log(testObj.nonExistentProperty.someMethod());
    //   } catch (e) {
    //     Sentry.captureException(e, {
    //       tags: { test_error: 'true' }
    //     });
    //   }
    // }, 3000);
  }
} else if (process.env.NODE_ENV === 'production') {
  console.warn('Sentry DSN not configured. Error reporting is disabled.');
}

root.render(<App />);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
}

