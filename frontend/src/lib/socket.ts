import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: { token: useAuthStore.getState().token },
  autoConnect: false,
});
