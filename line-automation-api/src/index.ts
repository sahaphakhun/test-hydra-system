import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';
import { SERVER_CONFIG, DB_CONFIG } from './config';
import automationRoutes from './routes/automationRoutes';
import accountRoutes from './routes/accountRoutes';
import { setWebSocketServer } from './controllers/automationController';

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

// จัดการการเชื่อมต่อ WebSocket
wss.on('connection', (ws) => {
  console.log('Client เชื่อมต่อ WebSocket');
  
  // ส่งข้อความเมื่อเชื่อมต่อสำเร็จ
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connection to status server established.'
  }));
  
  ws.on('close', () => {
    console.log('Client ตัดการเชื่อมต่อ WebSocket');
  });
});

// เชื่อมต่อกับ MongoDB
mongoose
  .connect(DB_CONFIG.MONGODB_URI)
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