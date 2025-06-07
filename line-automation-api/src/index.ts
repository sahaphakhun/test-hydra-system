import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { SERVER_CONFIG, DB_CONFIG, SOCKET_CONFIG } from './config';
import automationRoutes from './routes/automationRoutes';
import accountRoutes from './routes/accountRoutes';
import { setSocketIO } from './controllers/automationController';

const app = express();
const server = http.createServer(app);

// ตั้งค่า CORS options ทั้ง express และ Socket.IO
const corsOptions = {
  origin: SERVER_CONFIG.CORS_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));

// ตั้งค่า Socket.IO พร้อม CORS
const io = new Server(server, {
  cors: corsOptions,
});

// ส่ง Socket.IO instance ให้กับ controller
setSocketIO(io);

// Middleware
app.use(express.json());

// Routes
app.use('/', automationRoutes);
app.use('/', accountRoutes);

// เชื่อมต่อกับ MongoDB
mongoose
  .connect(DB_CONFIG.MONGODB_URI)
  .then(() => {
    console.log('เชื่อมต่อกับ MongoDB สำเร็จ');
    
    // เริ่ม HTTP Server โดยใช้พอร์ตจาก environment เท่านั้น
    const port = process.env.PORT ? parseInt(process.env.PORT) : SERVER_CONFIG.PORT;
    server.listen(port, () => {
      console.log(`API Server กำลังทำงานที่พอร์ต ${port}`);
    });
    
    // จัดการการเชื่อมต่อ Socket.IO
    io.on('connection', (socket) => {
      console.log('Client เชื่อมต่อ Socket.IO: ' + socket.id);
      
      socket.emit('connection', {
        type: 'connection',
        message: 'Connection to status server established.',
      });
      
      socket.on('disconnect', () => {
        console.log('Client ตัดการเชื่อมต่อ Socket.IO: ' + socket.id);
      });
    });
  })
  .catch((error) => {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ MongoDB:', error);
  }); 