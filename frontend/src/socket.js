import { io } from 'socket.io-client';
import { API_URL } from './config';

const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) return process.env.REACT_APP_SOCKET_URL;
  if (process.env.NODE_ENV === 'production') {
    // In production, connect to the backend URL, not the frontend URL
    return 'https://gig-worker-finder-backend.onrender.com';
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
