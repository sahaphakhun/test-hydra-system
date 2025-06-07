'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface WebSocketContextType {
  socket: WebSocket | null;
  status: string;
  statusMessage: string;
  statusDetails: any;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  status: '',
  statusMessage: '',
  statusDetails: null,
  connected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusDetails, setStatusDetails] = useState<any>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // ใช้ค่า Server URL จาก environment หรือ default เป็น localhost
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;
    
    // สร้าง WebSocket เมื่อ component mount
    const ws = new WebSocket(`wss://${WS_URL.replace(/^https?:\/\//, '')}`);
    setSocket(ws);

    // จัดการกับ events ต่างๆ
    ws.onopen = () => {
      console.log('WebSocket เชื่อมต่อแล้ว');
      setConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket ปิดการเชื่อมต่อ');
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        console.log('WebSocket ได้รับข้อมูล:', event.data);
        const data = JSON.parse(event.data);
        console.log('WebSocket parsed data:', data);
        if (data.type === 'statusUpdate') {
          console.log('สถานะ:', data.status, data.message);
          setStatus(data.status);
          setStatusMessage(data.message);
          setStatusDetails(data.details || null);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup เมื่อ component unmount
    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, status, statusMessage, statusDetails, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}; 