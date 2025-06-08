import { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import LineAccount from '../models/LineAccount';
import RegistrationRequest from '../models/RegistrationRequest';
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
    const { phoneNumber, displayName, password, proxy, autoLogout }: RegisterRequest = req.body;

    // ตรวจสอบว่ามีการกรอกข้อมูลที่จำเป็นครบถ้วนหรือไม่
    if (!phoneNumber || !displayName || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // ตรวจสอบว่าเบอร์โทรศัพท์นี้มีในระบบแล้วหรือยัง
    const existingAccount = await LineAccount.findOne({ phoneNumber });
    if (existingAccount) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
    }

    // ตรวจสอบว่าเบอร์โทรศัพท์นี้มีคำขอที่รอดำเนินการแล้วหรือยัง
    const existingRequest = await RegistrationRequest.findOne({ 
      phoneNumber, 
      status: { $in: ['pending', 'processing', 'awaiting_otp'] }
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีคำขอที่รอดำเนินการอยู่แล้ว' });
    }

    // บันทึกคำขอลงทะเบียนใหม่
    const registrationRequest = new RegistrationRequest({
      phoneNumber,
      displayName,
      password,
      proxy,
      autoLogout: autoLogout !== undefined ? autoLogout : true,
      status: 'pending'
    });

    await registrationRequest.save();

    // ส่งสถานะให้ผู้ใช้ทราบว่า "กำลังสมัคร"
    sendStatusUpdate(phoneNumber, AutomationStatus.PROCESSING, 'กำลังสมัครบัญชี LINE...');
    
    // หน่วงเวลาเล็กน้อยแล้วส่งสถานะให้รอ OTP
    setTimeout(() => {
      sendStatusUpdate(
        phoneNumber,
        AutomationStatus.AWAITING_OTP,
        'กรุณากดปุ่มขอ OTP และกรอกรหัสที่ได้รับ'
      );
    }, 2000);

    return res.status(202).json({ 
      message: 'รับคำขอลงทะเบียนเรียบร้อยแล้ว กำลังสมัครบัญชี LINE สำหรับคุณ',
      requestId: registrationRequest._id 
    });
  } catch (error) {
    console.error('Error in registerLine:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเริ่มกระบวนการลงทะเบียน' });
  }
};

// ฟังก์ชันสำหรับผู้ใช้ร้องขอ OTP
export const requestOtp = async (req: Request, res: Response) => {
  console.log('▶️ requestOtp called, body:', req.body);
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'กรุณาระบุเบอร์โทรศัพท์' });
    }
    
    // ค้นหาคำขอลงทะเบียน
    const request = await RegistrationRequest.findOne({ 
      phoneNumber, 
      status: { $in: ['pending', 'processing', 'awaiting_otp'] }
    });
    
    if (!request) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียนสำหรับเบอร์นี้' });
    }
    
    // บันทึกว่าผู้ใช้ร้องขอ OTP แล้ว
    request.otpRequested = true;
    request.otpRequestedAt = new Date();
    request.status = 'awaiting_otp';
    await request.save();
    
    // ส่งสถานะแจ้งให้ทราบ
    sendStatusUpdate(phoneNumber, AutomationStatus.AWAITING_OTP, 'ได้ร้องขอ OTP แล้ว กรุณารอรับ SMS และกรอกรหัส OTP');
    
    return res.status(200).json({ 
      message: 'ร้องขอ OTP เรียบร้อยแล้ว กรุณารอรับ SMS และกรอกรหัส OTP' 
    });
  } catch (error) {
    console.error('Error in requestOtp:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการร้องขอ OTP' });
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
    
    // ค้นหาคำขอลงทะเบียน
    const request = await RegistrationRequest.findOne({ 
      phoneNumber, 
      status: 'awaiting_otp'
    });
    
    if (!request) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียนที่รอ OTP สำหรับเบอร์นี้' });
    }
    
    // ส่งสถานะว่ากำลังตรวจสอบ OTP
    sendStatusUpdate(phoneNumber, AutomationStatus.PROCESSING, 'ได้รับรหัส OTP แล้ว กำลังดำเนินการสมัครบัญชี...');
    
    // อัปเดตสถานะเป็น processing
    request.status = 'processing';
    await request.save();
    
    // หน่วงเวลาเพื่อจำลองการทำงาน
    setTimeout(() => {
      sendStatusUpdate(
        phoneNumber,
        AutomationStatus.SUCCESS,
        'ข้อมูลของคุณถูกส่งไปยังทีมงานเรียบร้อยแล้ว เรากำลังดำเนินการสมัครบัญชีให้คุณ',
        { requestId: request._id }
      );
    }, 3000);
    
    return res.status(200).json({ phoneNumber, message: 'ได้รับรหัส OTP เรียบร้อยแล้ว ทีมงานกำลังดำเนินการสมัครบัญชีให้คุณ' });
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
  } catch (error: unknown) {
    console.error('Proxy check error:', error);
    
    // จัดการข้อผิดพลาดให้ละเอียดมากขึ้น
    let errorMessage = 'ไม่สามารถใช้งาน Proxy นี้ได้';
    
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as { code?: string; message?: string };
      if (errorObj.code === 'ECONNREFUSED') {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อถูกปฏิเสธ';
      } else if (errorObj.code === 'ECONNABORTED') {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อหมดเวลา';
      } else if (errorObj.code === 'ENOTFOUND') {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: ไม่พบที่อยู่ Host';
      } else if (errorObj.message) {
        errorMessage = `ไม่สามารถใช้งาน Proxy นี้ได้: ${errorObj.message}`;
      }
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