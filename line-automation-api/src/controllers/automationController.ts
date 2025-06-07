import { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import LineAccount from '../models/LineAccount';
import { AutomationStatus, RegisterRequest, OtpRequest } from '../types';

// สำหรับเก็บ WebSocket server instance
let wss: WebSocketServer;

// ตั้งค่า WebSocket server instance
export const setWebSocketServer = (webSocketServer: WebSocketServer) => {
  wss = webSocketServer;
};

// สำหรับเก็บข้อมูล OTP ที่ได้รับจากผู้ใช้
let currentOtp = '';

// ทดสอบการเชื่อมต่อกับ API
export const testConnection = (req: Request, res: Response) => {
  res.status(200).json({ message: 'สวัสดี! API Server สำหรับระบบ LINE Automation กำลังทำงานอยู่' });
};

// เริ่มกระบวนการลงทะเบียน
export const registerLine = async (req: Request, res: Response) => {
  console.log('▶️ registerLine called, body:', req.body);
  try {
    const { phoneNumber, displayName, password, proxy }: RegisterRequest = req.body;

    // ตรวจสอบว่ามีการกรอกข้อมูลที่จำเป็นครบถ้วนหรือไม่
    if (!phoneNumber || !displayName || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // ตรวจสอบว่าเบอร์โทรศัพท์นี้มีในระบบแล้วหรือยัง
    const existingAccount = await LineAccount.findOne({ phoneNumber });
    if (existingAccount) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
    }

    // จำลองการเริ่มกระบวนการลงทะเบียน
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner
    sendStatusUpdate(AutomationStatus.PROCESSING, 'กำลังเริ่มกระบวนการลงทะเบียน...');
    
    // หน่วงเวลาเพื่อจำลองการทำงาน
    setTimeout(() => {
      sendStatusUpdate(
        AutomationStatus.WAITING_OTP,
        'โปรดกรอกรหัส OTP ที่ได้รับทาง SMS',
        { phoneNumber }
      );
    }, 2000);

    return res.status(202).json({ message: 'Automation process started.' });
  } catch (error) {
    console.error('Error in registerLine:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเริ่มกระบวนการลงทะเบียน' });
  }
};

// รับและบันทึกค่า OTP
export const submitOtp = async (req: Request, res: Response) => {
  console.log('▶️ submitOtp called, body:', req.body);
  try {
    const { otp }: OtpRequest = req.body;
    
    if (!otp) {
      return res.status(400).json({ message: 'กรุณากรอกรหัส OTP' });
    }
    
    // บันทึกค่า OTP ที่ได้รับ
    currentOtp = otp;
    
    // จำลองกระบวนการตรวจสอบ OTP
    sendStatusUpdate(AutomationStatus.PROCESSING, 'กำลังตรวจสอบรหัส OTP...');
    
    // หน่วงเวลาเพื่อจำลองการทำงาน
    setTimeout(() => {
      // สร้างบัญชีใหม่ (ในสถานการณ์จริงจะมีการตรวจสอบกับ LINE ก่อน)
      const newAccount = new LineAccount({
        phoneNumber: '0812345678', // ควรได้จากสถานะการลงทะเบียนจริง
        displayName: 'LINE User', // ควรได้จากสถานะการลงทะเบียนจริง
        password: 'password123', // ควรได้จากสถานะการลงทะเบียนจริง
        status: 'active',
      });
      
      newAccount.save();
      
      sendStatusUpdate(
        AutomationStatus.SUCCESS,
        'ลงทะเบียนสำเร็จ',
        { accountId: newAccount._id }
      );
    }, 2000);
    
    return res.status(200).json({ message: 'OTP received and saved.' });
  } catch (error) {
    console.error('Error in submitOtp:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกรหัส OTP' });
  }
};

// รับการอัปเดตสถานะจาก Automation Runner และส่งต่อให้ Frontend ผ่าน WebSocket
export const receiveStatus = (req: Request, res: Response) => {
  console.log('▶️ receiveStatus called, body:', req.body);
  try {
    const { status, message, details } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'กรุณาระบุสถานะ' });
    }
    
    sendStatusUpdate(status, message, details);
    
    return res.status(200).json({ message: 'Status received.' });
  } catch (error) {
    console.error('Error in receiveStatus:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการรับสถานะ' });
  }
};

// สำหรับล้างข้อมูลแอป LINE (Logout)
export const logout = (req: Request, res: Response) => {
  try {
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้ล้างข้อมูล
    
    return res.status(200).json({ message: 'LINE app data cleared successfully.' });
  } catch (error) {
    console.error('Error in logout:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการล้างข้อมูลแอป LINE' });
  }
};

// ฟังก์ชันสำหรับส่งข้อมูลสถานะผ่าน WebSocket
const sendStatusUpdate = (status: string, message: string, details?: any) => {
  console.log(`🔔 Sending statusUpdate: status=${status}, message=${message}, details=`, details);
  if (wss) {
    console.log(`🔔 WebSocket clients count: ${wss.clients.size}`);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({
          type: 'statusUpdate',
          status,
          message,
          details,
        });
        console.log(`🔔 Sending to client: ${payload}`);
        client.send(payload);
      } else {
        console.log(`🔔 Client not ready: ${client.readyState}`);
      }
    });
  } else {
    console.log(`🔔 WebSocket server not initialized!`);
  }
};