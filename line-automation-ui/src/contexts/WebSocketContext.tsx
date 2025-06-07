'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface IWebSocketContext {
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<IWebSocketContext>({
  send: () => {},
  isConnected: false,
});

const RAW_ENDPOINT = process.env.NEXT_PUBLIC_WS_URL;
// แปลง http://, https:// ไปเป็น ws://, wss:// ตามลำดับ หากผู้ใช้ตั้งค่าผิด
const WS_ENDPOINT = RAW_ENDPOINT?.replace(/^http/, 'ws');

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // connect once
  useEffect(() => {
    if (!WS_ENDPOINT) {
      console.warn('NEXT_PUBLIC_WS_URL is not defined, WebSocket disabled');
      return;
    }

    const socket = new WebSocket(WS_ENDPOINT);
    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);

    socket.onerror = console.error;

    return () => {
      socket.close();
    };
  }, []);

  const send = useCallback<IWebSocketContext['send']>((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ send, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext); 