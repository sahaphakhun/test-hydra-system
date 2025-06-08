import dotenv from 'dotenv';

// โหลดค่าตัวแปรสภาพแวดล้อมจากไฟล์ .env
dotenv.config();

// การตั้งค่าสำหรับเซิร์ฟเวอร์
export const SERVER_CONFIG = {
  PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

// การตั้งค่าสำหรับฐานข้อมูล
export const DB_CONFIG = {
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/line-automation',
};

// การตั้งค่าสำหรับ Socket.IO
export const SOCKET_CONFIG = {
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
}; 