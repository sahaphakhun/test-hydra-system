"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_CONFIG = exports.DB_CONFIG = exports.SERVER_CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// โหลดค่าตัวแปรสภาพแวดล้อมจากไฟล์ .env
dotenv_1.default.config();
// การตั้งค่าสำหรับเซิร์ฟเวอร์
exports.SERVER_CONFIG = {
    PORT: Number(process.env.PORT) || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
// การตั้งค่าสำหรับฐานข้อมูล
exports.DB_CONFIG = {
    MONGODB_URI: process.env.MONGO_URL || 'mongodb://localhost:27017/line-automation',
};
// การตั้งค่าสำหรับ Socket.IO
exports.SOCKET_CONFIG = {
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
