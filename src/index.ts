import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';
import { SERVER_CONFIG, DB_CONFIG } from './config';
import automationRoutes from '../line-automation-api/src/routes/automationRoutes';
import accountRoutes from '../line-automation-api/src/routes/accountRoutes';
import adminRoutes from '../line-automation-api/src/routes/adminRoutes';
import { setWebSocketServer } from '../line-automation-api/src/controllers/automationController';

const app = express();
const server = http.createServer(app);

// ตั้งค่า CORS options สำหรับ express
const corsOptions = {
  origin: SERVER_CONFIG.CORS_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
};
// Enable CORS for Express
app.use(cors(corsOptions));

// ตั้งค่า WebSocket Server
const wss = new WebSocketServer({ server });

// ส่ง WebSocket server instance ให้กับ controller
setWebSocketServer(wss);

// Middleware
app.use(express.json());

// Routes
app.use('/', automationRoutes);
app.use('/', accountRoutes);
app.use('/', adminRoutes);

// Type assertion เพื่อแก้ปัญหา TypeScript
interface ExtendedWebSocket extends WebSocket {
  on(event: string, callback: Function): void;
}

// จัดการการเชื่อมต่อ WebSocket
wss.on('connection', function connection(ws, req) {
  // ใช้ type assertion เพื่อให้ TypeScript ยอมรับ .on method
  const extWs = ws as unknown as ExtendedWebSocket;
  
  console.log('Client เชื่อมต่อ WebSocket จาก:', req.socket.remoteAddress);
  console.log('WebSocket clients ทั้งหมด:', wss.clients.size);
  
  // ส่งข้อความเมื่อเชื่อมต่อสำเร็จ
  const connectionMessage = JSON.stringify({
    type: 'connection',
    message: 'Connection to status server established.'
  });
  console.log('ส่งข้อความเชื่อมต่อ:', connectionMessage);
  extWs.send(connectionMessage);
  
  // ทดสอบส่งข้อความสถานะทันที
  setTimeout(() => {
    const testMessage = JSON.stringify({
      type: 'statusUpdate',
      status: 'test',
      message: 'ทดสอบการเชื่อมต่อ WebSocket',
      details: { time: new Date().toISOString() }
    });
    console.log('ส่งข้อความทดสอบ:', testMessage);
    extWs.send(testMessage);
  }, 1000);
  
  // จัดการกับข้อความที่ได้รับจาก client
  extWs.on('message', function incoming(message) {
    console.log('ได้รับข้อความจาก client:', message.toString());
  });
  
  // จัดการกับข้อผิดพลาด
  extWs.on('error', function error(err) {
    console.error('WebSocket error:', err);
  });
  
  // จัดการกับการปิดการเชื่อมต่อ
  extWs.on('close', function close() {
    console.log('Client ตัดการเชื่อมต่อ WebSocket');
    console.log('WebSocket clients เหลือ:', wss.clients.size);
  });
});

// เชื่อมต่อกับ MongoDB
mongoose
  .connect(DB_CONFIG.MONGO_URL)
  .then(() => {
    console.log('เชื่อมต่อกับ MongoDB สำเร็จ');
    
    // เริ่ม HTTP Server โดยใช้พอร์ตจาก SERVER_CONFIG
    server.listen(SERVER_CONFIG.PORT, () => {
      console.log(`API Server กำลังทำงานที่พอร์ต ${SERVER_CONFIG.PORT}`);
    });
  })
  .catch((error) => {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ MongoDB:', error);
  }); 