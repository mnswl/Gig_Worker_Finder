export const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://gigworkerfinder-production.up.railway.app'
    : 'http://localhost:5000');
