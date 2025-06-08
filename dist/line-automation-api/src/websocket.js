"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastMessage = exports.sendMessage = exports.setupWebSocketHandlers = void 0;
const ws_1 = require("ws");
// เก็บการเชื่อมต่อ WebSocket ทั้งหมด
const clients = new Set();
/**
 * ตั้งค่าตัวจัดการ WebSocket
 */
function setupWebSocketHandlers(wss) {
    wss.on('connection', (ws) => {
        console.log('🔌 WebSocket client เชื่อมต่อแล้ว');
        // เพิ่มไคลเอนต์ใหม่ในรายการ
        clients.add(ws);
        // ส่งข้อความยืนยันการเชื่อมต่อ
        sendMessage(ws, 'STATUS_UPDATE', { status: 'connected' });
        // จัดการเมื่อได้รับข้อความ
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log('📩 ได้รับข้อความ WebSocket:', data);
                // ตรงนี้สามารถเพิ่มตรรกะสำหรับจัดการข้อความที่ได้รับ
            }
            catch (error) {
                console.error('❌ ข้อผิดพลาดในการแยกวิเคราะห์ข้อความ WebSocket:', error);
            }
        });
        // จัดการเมื่อปิดการเชื่อมต่อ
        ws.on('close', () => {
            console.log('🔌 WebSocket client ตัดการเชื่อมต่อแล้ว');
            clients.delete(ws);
        });
        // จัดการข้อผิดพลาด
        ws.on('error', (error) => {
            console.error('❌ ข้อผิดพลาด WebSocket:', error);
            clients.delete(ws);
        });
    });
}
exports.setupWebSocketHandlers = setupWebSocketHandlers;
/**
 * ส่งข้อความไปยังไคลเอนต์ WebSocket
 */
function sendMessage(ws, type, payload) {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        const message = {
            type,
            payload,
            timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(message));
    }
}
exports.sendMessage = sendMessage;
/**
 * ส่งข้อความไปยังไคลเอนต์ WebSocket ทั้งหมด
 */
function broadcastMessage(type, payload) {
    const message = {
        type,
        payload,
        timestamp: new Date().toISOString()
    };
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}
exports.broadcastMessage = broadcastMessage;
