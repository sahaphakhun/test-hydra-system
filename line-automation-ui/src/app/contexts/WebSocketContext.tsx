'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusDetails, setStatusDetails] = useState<any>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // ใช้ค่า Server URL จาก environment หรือ default เป็น localhost
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL!;
    
    // สร้าง Socket เมื่อ component mount
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // จัดการกับ events ต่างๆ
    newSocket.on('connect', () => {
      console.log('WebSocket เชื่อมต่อแล้ว');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket ปิดการเชื่อมต่อ');
      setConnected(false);
    });

    newSocket.on('statusUpdate', (data) => {
      console.log('สถานะ:', data.status, data.message);
      setStatus(data.status);
      setStatusMessage(data.message);
      setStatusDetails(data.details || null);
    });

    // Cleanup เมื่อ component unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, status, statusMessage, statusDetails, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}; 