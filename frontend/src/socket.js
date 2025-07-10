import { io } from 'socket.io-client';
import { API_URL } from './config';

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://gigworkerfinder-production.up.railway.app'
    : API_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
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
