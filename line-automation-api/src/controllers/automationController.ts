import { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import LineAccount from '../models/LineAccount';
import { AutomationStatus, RegisterRequest, OtpRequest, CheckProxyRequest } from '../types';
import axios from 'axios';
import { URL } from 'url';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
    sendStatusUpdate(phoneNumber, AutomationStatus.PROCESSING, 'กำลังเริ่มกระบวนการลงทะเบียน...');
    
    // หน่วงเวลาเพื่อจำลองการทำงาน
    setTimeout(() => {
      sendStatusUpdate(
        phoneNumber,
        AutomationStatus.AWAITING_OTP,
        'โปรดกรอกรหัส OTP ที่ได้รับทาง SMS'
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
    const { phoneNumber, otp }: OtpRequest = req.body;
    
    if (!otp) {
      return res.status(400).json({ message: 'กรุณากรอกรหัส OTP' });
    }
    
    // บันทึกค่า OTP ที่ได้รับ
    currentOtp = otp;
    
    // จำลองกระบวนการตรวจสอบ OTP
    sendStatusUpdate(phoneNumber, AutomationStatus.PROCESSING, 'กำลังตรวจสอบรหัส OTP...');
    
    // หน่วงเวลาเพื่อจำลองการทำงาน
    setTimeout(() => {
      // สร้างบัญชีใหม่ (ในสถานการณ์จริงจะมีการตรวจสอบกับ LINE ก่อน และใช้ข้อมูลจริง)
      const newAccount = new LineAccount({
        phoneNumber,
        displayName: 'LINE User', // ในกรณีจริงควรได้จากผลลัพธ์ Automation
        password: 'password123', // เช่นเดียวกันควรใช้รหัสจริงที่สร้างไว้
        status: 'active',
      });
      
      newAccount.save();
      
      sendStatusUpdate(
        newAccount.phoneNumber,
        AutomationStatus.SUCCESS,
        'ลงทะเบียนสำเร็จ',
        { accountId: newAccount._id }
      );
    }, 2000);
    
    return res.status(200).json({ phoneNumber, message: 'OTP received and saved.' });
  } catch (error) {
    console.error('Error in submitOtp:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกรหัส OTP' });
  }
};

// เช็ก Proxy ว่าถูกต้องและใช้งานได้
export const checkProxy = async (req: Request, res: Response) => {
  console.log('▶️ checkProxy called, body:', req.body);
  const { proxy }: CheckProxyRequest = req.body;
  
  // ตรวจสอบว่ามีการส่ง Proxy มาหรือไม่
  if (!proxy || proxy.trim() === '') {
    return res.status(400).json({ message: 'กรุณากรอก Proxy' });
  }
  
  // ตรวจสอบรูปแบบของ Proxy
  let urlObj;
  try {
    urlObj = new URL(proxy);
  } catch (error) {
    console.error('Invalid proxy URL format:', error);
    return res.status(400).json({ message: 'รูปแบบ Proxy ไม่ถูกต้อง' });
  }
  
  // ตรวจสอบโปรโตคอลของ Proxy
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return res.status(400).json({ message: 'รูปแบบ Proxy ไม่ถูกต้อง โปรโตคอลต้องเป็น http หรือ https เท่านั้น' });
  }
  
  // ทดสอบการเช็ก proxy ผ่าน agent จริง
  try {
    const agent = new HttpsProxyAgent(proxy);
    const response = await axios.get('https://api.ipify.org?format=json', {
      httpsAgent: agent,
      timeout: 5000,
    });
    
    // ตรวจสอบว่าได้รับข้อมูล IP หรือไม่
    if (response.data && response.data.ip) {
      console.log('Proxy check successful, IP:', response.data.ip);
      return res.status(200).json({ message: 'Proxy ใช้งานได้', ip: response.data.ip });
    } else {
      console.error('Proxy check failed: No IP in response');
      return res.status(400).json({ message: 'ไม่สามารถใช้งาน Proxy นี้ได้: ไม่ได้รับข้อมูล IP' });
    }
  } catch (error) {
    console.error('Proxy check error:', error);
    
    // จัดการข้อผิดพลาดให้ละเอียดมากขึ้น
    let errorMessage = 'ไม่สามารถใช้งาน Proxy นี้ได้';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อถูกปฏิเสธ';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อหมดเวลา';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: ไม่พบที่อยู่ Host';
    }
    
    return res.status(400).json({ message: errorMessage });
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
    
    const phoneNumber: string | undefined = (details && details.phoneNumber) || undefined;
    sendStatusUpdate(phoneNumber, status, message, details);
    
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
const sendStatusUpdate = (phoneNumber: string | undefined, status: string, message: string, details?: any) => {
  console.log(`🔔 Sending statusUpdate: phoneNumber=${phoneNumber}, status=${status}, message=${message}, details=`, details);
  if (wss) {
    console.log(`🔔 WebSocket clients count: ${wss.clients.size}`);
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({
          type: 'statusUpdate',
          phoneNumber,
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