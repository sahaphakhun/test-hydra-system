"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const ws_1 = require("ws");
const routes_1 = require("./routes");
const websocket_1 = require("./websocket");
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const automationRoutes_1 = __importDefault(require("./routes/automationRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
// โหลดค่าจาก .env
dotenv_1.default.config();
// กำหนดค่าเริ่มต้น
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/line-automation';
// สร้าง Express app
const app = (0, express_1.default)();
// middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// สร้าง HTTP server จาก Express app
const server = (0, http_1.createServer)(app);
// เชื่อมต่อกับ MongoDB
mongoose_1.default.connect(MONGO_URL)
    .then(() => {
    console.log('✅ เชื่อมต่อกับ MongoDB สำเร็จ');
})
    .catch((error) => {
    console.error('❌ เชื่อมต่อกับ MongoDB ล้มเหลว:', error);
    process.exit(1);
});
// ลงทะเบียน routes
(0, routes_1.registerRoutes)(app);
app.use('/', adminRoutes_1.default);
app.use('/', automationRoutes_1.default);
app.use('/', accountRoutes_1.default);
// ตั้งค่า WebSocket
const wss = new ws_1.WebSocketServer({ server });
(0, websocket_1.setupWebSocketHandlers)(wss);
// เริ่มต้น server
server.listen(PORT, () => {
    console.log(`🚀 Server เริ่มทำงานที่ http://localhost:${PORT}`);
});
// จัดการการปิดเซิร์ฟเวอร์อย่างสง่างาม
process.on('SIGINT', () => {
    console.log('👋 ปิด server');
    mongoose_1.default.connection.close()
        .then(() => {
        console.log('✅ ปิดการเชื่อมต่อ MongoDB');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ ปิดการเชื่อมต่อ MongoDB ล้มเหลว:', error);
        process.exit(1);
    });
});
