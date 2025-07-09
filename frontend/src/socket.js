import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? '' // same origin in production (assumes api proxy)
  : 'http://localhost:5000';

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
