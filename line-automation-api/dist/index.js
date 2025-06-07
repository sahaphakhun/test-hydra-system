"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const ws_1 = require("ws");
const config_1 = require("./config");
const automationRoutes_1 = __importDefault(require("./routes/automationRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const automationController_1 = require("./controllers/automationController");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// ตั้งค่า CORS options สำหรับ express
const corsOptions = {
    origin: config_1.SERVER_CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
};
// Enable CORS for Express
app.use((0, cors_1.default)(corsOptions));
// ตั้งค่า WebSocket Server
const wss = new ws_1.WebSocketServer({ server });
// ส่ง WebSocket server instance ให้กับ controller
(0, automationController_1.setWebSocketServer)(wss);
// Middleware
app.use(express_1.default.json());
// Routes
app.use('/', automationRoutes_1.default);
app.use('/', accountRoutes_1.default);
// จัดการการเชื่อมต่อ WebSocket
wss.on('connection', (ws, req) => {
    console.log('Client เชื่อมต่อ WebSocket จาก:', req.socket.remoteAddress);
    console.log('WebSocket clients ทั้งหมด:', wss.clients.size);
    // ส่งข้อความเมื่อเชื่อมต่อสำเร็จ
    const connectionMessage = JSON.stringify({
        type: 'connection',
        message: 'Connection to status server established.'
    });
    console.log('ส่งข้อความเชื่อมต่อ:', connectionMessage);
    ws.send(connectionMessage);
    // ทดสอบส่งข้อความสถานะทันที
    setTimeout(() => {
        const testMessage = JSON.stringify({
            type: 'statusUpdate',
            status: 'test',
            message: 'ทดสอบการเชื่อมต่อ WebSocket',
            details: { time: new Date().toISOString() }
        });
        console.log('ส่งข้อความทดสอบ:', testMessage);
        ws.send(testMessage);
    }, 1000);
    ws.on('message', (message) => {
        console.log('ได้รับข้อความจาก client:', message.toString());
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    ws.on('close', () => {
        console.log('Client ตัดการเชื่อมต่อ WebSocket');
        console.log('WebSocket clients เหลือ:', wss.clients.size);
    });
});
// เชื่อมต่อกับ MongoDB
mongoose_1.default
    .connect(config_1.DB_CONFIG.MONGODB_URI)
    .then(() => {
    console.log('เชื่อมต่อกับ MongoDB สำเร็จ');
    // เริ่ม HTTP Server โดยใช้พอร์ตจาก SERVER_CONFIG
    server.listen(config_1.SERVER_CONFIG.PORT, () => {
        console.log(`API Server กำลังทำงานที่พอร์ต ${config_1.SERVER_CONFIG.PORT}`);
    });
})
    .catch((error) => {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ MongoDB:', error);
});
