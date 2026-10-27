import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectCrowdSocket(onEvent: (eventName: string, payload: unknown) => void) {
  const url = import.meta.env.VITE_SOCKET_URL || "https://hiring-dev.internal.kloudspot.com";

  socket = io(url, {
    autoConnect: true,
    // The assessment gateway accepts Socket.IO long-polling but closes a
    // direct WebSocket upgrade. Starting with polling prevents the noisy
    // failed WebSocket attempt while retaining live event delivery.
    transports: ["polling"],
    upgrade: false,
    timeout: 15000,
    auth: {
      token: sessionStorage.getItem("crowd_access_token") || "",
    },
  });

  // Verified against the running backend's Socket.IO stream.
  const eventNames = ["alert", "live_occupancy"];
  eventNames.forEach((eventName) => {
    socket?.on(eventName, (payload: unknown) => onEvent(eventName, payload));
  });

  return socket;
}

export function disconnectCrowdSocket() {
  socket?.disconnect();
  socket = null;
}
