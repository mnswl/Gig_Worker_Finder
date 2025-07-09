import { io } from 'socket.io-client';
import { API_URL } from './config';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? '' // same origin in production (assumes api proxy)
  : API_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

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
