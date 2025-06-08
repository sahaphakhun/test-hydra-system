'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface IWebSocketContext {
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  isConnected: boolean;
  addMessageListener: (listener: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<IWebSocketContext>({
  send: () => {},
  isConnected: false,
  addMessageListener: () => () => {},
});

const RAW_ENDPOINT = process.env.NEXT_PUBLIC_WS_URL;
// แปลง http://, https:// ไปเป็น ws://, wss:// ตามลำดับ หากผู้ใช้ตั้งค่าผิด
const WS_ENDPOINT = RAW_ENDPOINT?.replace(/^http/, 'ws');

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Array<(data: any) => void>>([]);

  // connect once
  useEffect(() => {
    if (!WS_ENDPOINT) {
      console.warn('NEXT_PUBLIC_WS_URL is not defined, WebSocket disabled');
      return;
    }

    try {
      const socket = new WebSocket(WS_ENDPOINT);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          listenersRef.current.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error('Error in message listener:', err);
            }
          });
        } catch (err) {
          console.error('Invalid WS message', err);
        }
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, []);

  const send = useCallback<IWebSocketContext['send']>((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }, []);

  const addMessageListener = useCallback<
    IWebSocketContext['addMessageListener']
  >(
    (listener) => {
      listenersRef.current.push(listener);
      return () => {
        listenersRef.current = listenersRef.current.filter((l) => l !== listener);
      };
    },
    []
  );

  return (
    <WebSocketContext.Provider value={{ send, isConnected, addMessageListener }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 
