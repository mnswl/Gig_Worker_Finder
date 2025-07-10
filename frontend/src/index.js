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

const root = ReactDOM.createRoot(document.getElementById('root'));
AOS.init({ duration: 700, once: true });
root.render(<App />);

