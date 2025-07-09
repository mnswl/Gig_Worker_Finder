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

