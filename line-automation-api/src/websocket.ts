import { WebSocketServer, WebSocket } from 'ws';

// เก็บการเชื่อมต่อ WebSocket ทั้งหมด
const clients = new Set<WebSocket>();

// ประเภทข้อความที่ส่งผ่าน WebSocket
type WSMessageType = 'NOTIFICATION' | 'STATUS_UPDATE' | 'ERROR' | 'ADD_FRIENDS_UPDATE';

// โครงสร้างข้อความ WebSocket
interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: string;
}

/**
 * ตั้งค่าตัวจัดการ WebSocket
 */
export function setupWebSocketHandlers(wss: WebSocketServer): void {
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
        
      } catch (error) {
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

/**
 * ส่งข้อความไปยังไคลเอนต์ WebSocket
 */
export function sendMessage(ws: WebSocket, type: WSMessageType, payload: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    const message: WSMessage = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(message));
  }
}

/**
 * ส่งข้อความไปยังไคลเอนต์ WebSocket ทั้งหมด
 */
export function broadcastMessage(type: WSMessageType, payload: any): void {
  const message: WSMessage = {
    type,
    payload,
    timestamp: new Date().toISOString()
  };
  
  const messageStr = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
} 