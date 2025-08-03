import { io } from 'socket.io-client';
import { API_URL } from './config';

const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) return process.env.REACT_APP_SOCKET_URL;
  if (process.env.NODE_ENV === 'production') {
    // Use the same origin as the page to avoid hard-coded ports in production (Railway maps ports)
    const { protocol, host } = window.location;
    const scheme = protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${host}`;
  }
  return API_URL;
};

const SOCKET_URL = getSocketUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
});

// suppress noisy connect errors in production
socket.on('connect_error', () => {});

export const connectSocket = () => {
  const token = localStorage.getItem('token');
  if (token) {
    if (socket.auth?.token !== token) {
      socket.auth = { token };
    }
    if (!socket.connected) {
      socket.connect();
    }
  }
};
