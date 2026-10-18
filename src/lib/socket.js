import { io } from "socket.io-client";
import { API_BASE } from "./api";

const SOCKET_URL = new URL(API_BASE).origin;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  auth: { token: localStorage.getItem("token") || null },
});

export const ensureSocketAuthentication = () => {
  const token = localStorage.getItem("token") || null;
  if (socket.auth?.token === token) return;

  socket.auth = { token };
  if (socket.connected) socket.disconnect();
  socket.connect();
};
