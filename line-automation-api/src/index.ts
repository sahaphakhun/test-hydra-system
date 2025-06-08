import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { registerRoutes } from './routes';
import { setupWebSocketHandlers } from './websocket';
import adminRoutes from './routes/adminRoutes';

// โหลดค่าจาก .env
dotenv.config();

// กำหนดค่าเริ่มต้น
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/line-automation';

// สร้าง Express app
const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// สร้าง HTTP server จาก Express app
const server = createServer(app);

// เชื่อมต่อกับ MongoDB
mongoose.connect(MONGO_URL)
  .then(() => {
    console.log('✅ เชื่อมต่อกับ MongoDB สำเร็จ');
  })
  .catch((error) => {
    console.error('❌ เชื่อมต่อกับ MongoDB ล้มเหลว:', error);
    process.exit(1);
  });

// ลงทะเบียน routes
registerRoutes(app);
app.use('/', adminRoutes);

// ตั้งค่า WebSocket
const wss = new WebSocketServer({ server });
setupWebSocketHandlers(wss);

// เริ่มต้น server
server.listen(PORT, () => {
  console.log(`🚀 Server เริ่มทำงานที่ http://localhost:${PORT}`);
});

// จัดการการปิดเซิร์ฟเวอร์อย่างสง่างาม
process.on('SIGINT', () => {
  console.log('👋 ปิด server');
  mongoose.connection.close()
    .then(() => {
      console.log('✅ ปิดการเชื่อมต่อ MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ ปิดการเชื่อมต่อ MongoDB ล้มเหลว:', error);
      process.exit(1);
    });
}); 
