import { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import axios from 'axios';
import { URL } from 'url';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { LineAccount } from '../models/LineAccount';
import RegistrationRequest from '../models/RegistrationRequest';
import { AutomationStatus, RegisterRequest, OtpRequest } from '../types';

let wss: WebSocketServer;

export const setWebSocketServer = (webSocketServer: WebSocketServer) => {
  wss = webSocketServer;
};

export const testConnection = (req: Request, res: Response) => {
  res.status(200).json({ message: 'สวัสดี! API Server สำหรับระบบ LINE Automation กำลังทำงานอยู่' });
};

export const registerLine = async (req: Request, res: Response) => {
  console.log('▶️ registerLine called, body:', req.body);
  try {
    const { phoneNumber, displayName, password, proxy, autoLogout }: RegisterRequest = req.body;
    if (!phoneNumber || !displayName || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    const existingAccount = await LineAccount.findOne({ phoneNumber });
    if (existingAccount) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
    }
    const existingRequest = await RegistrationRequest.findOne({
      phoneNumber,
      status: { $in: ['pending', 'processing', 'awaiting_otp'] },
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีคำขอที่รอดำเนินการอยู่แล้ว' });
    }
    const registrationRequest = new RegistrationRequest({
      phoneNumber,
      displayName,
      password,
      proxy,
      autoLogout: autoLogout !== undefined ? autoLogout : true,
      status: 'pending',
    });
    await registrationRequest.save();
    sendStatusUpdate(phoneNumber, AutomationStatus.PROCESSING, 'กำลังสมัครบัญชี LINE...');
    setTimeout(() => {
      sendStatusUpdate(
        phoneNumber,
        AutomationStatus.AWAITING_OTP,
        'กรุณากดปุ่มขอ OTP และกรอกรหัสที่ได้รับ'
      );
    }, 2000);
    return res.status(202).json({
      message: 'รับคำขอลงทะเบียนเรียบร้อยแล้ว กำลังสมัครบัญชี LINE สำหรับคุณ',
      requestId: registrationRequest._id,
    });
  } catch (error) {
    console.error('Error in registerLine:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเริ่มกระบวนการลงทะเบียน' });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  console.log('▶️ requestOtp called, body:', req.body);
  try {
    const { phoneNumber }: { phoneNumber: string } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: 'กรุณาระบุเบอร์โทรศัพท์' });
    }
    const requestEntry = await RegistrationRequest.findOne({
      phoneNumber,
      status: { $in: ['pending', 'processing', 'awaiting_otp'] },
    });
    if (!requestEntry) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียนสำหรับเบอร์นี้' });
    }
    requestEntry.otpRequested = true;
    requestEntry.otpRequestedAt = new Date();
    requestEntry.status = 'awaiting_otp';
    await requestEntry.save();
    sendStatusUpdate(
      phoneNumber,
      AutomationStatus.AWAITING_OTP,
      'ได้ร้องขอ OTP แล้ว กรุณารอรับ SMS และกรอกรหัส OTP'
    );
    return res.status(200).json({
      message: 'ร้องขอ OTP เรียบร้อยแล้ว กรุณารอรับ SMS และกรอกรหัส OTP',
    });
  } catch (error) {
    console.error('Error in requestOtp:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการร้องขอ OTP' });
  }
};

export const submitOtp = async (req: Request, res: Response) => {
  console.log('▶️ submitOtp called, body:', req.body);
  try {
    const { phoneNumber, otp }: OtpRequest = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'กรุณากรอกรหัส OTP' });
    }
    const requestEntry = await RegistrationRequest.findOne({
      phoneNumber,
      status: 'awaiting_otp',
    });
    if (!requestEntry) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียนที่รอ OTP สำหรับเบอร์นี้' });
    }
    sendStatusUpdate(
      phoneNumber,
      AutomationStatus.PROCESSING,
      'ได้รับรหัส OTP แล้ว กำลังดำเนินการสมัครบัญชี...'
    );
    requestEntry.status = 'processing';
    await requestEntry.save();
    setTimeout(() => {
      sendStatusUpdate(
        phoneNumber,
        AutomationStatus.SUCCESS,
        'ข้อมูลของคุณถูกส่งไปยังทีมงานเรียบร้อยแล้ว เรากำลังดำเนินการสมัครบัญชีให้คุณ',
        { requestId: requestEntry._id }
      );
    }, 3000);
    return res.status(200).json({ phoneNumber, message: 'ได้รับรหัส OTP เรียบร้อยแล้ว ทีมงานกำลังดำเนินการสมัครบัญชีให้คุณ' });
  } catch (error) {
    console.error('Error in submitOtp:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกรหัส OTP' });
  }
};

export const checkProxy = async (req: Request, res: Response) => {
  console.log('▶️ checkProxy called, body:', req.body);
  try {
    const { proxy }: { proxy: string } = req.body;
    if (!proxy || proxy.trim() === '') {
      return res.status(400).json({ message: 'กรุณากรอก Proxy' });
    }
    let urlObj: URL;
    try {
      urlObj = new URL(proxy);
    } catch (error) {
      console.error('Invalid proxy URL format:', error);
      return res.status(400).json({ message: 'รูปแบบ Proxy ไม่ถูกต้อง' });
    }
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return res.status(400).json({ message: 'รูปแบบ Proxy ไม่ถูกต้อง โปรโตคอลต้องเป็น http หรือ https เท่านั้น' });
    }
    const agent = new HttpsProxyAgent(proxy);
    const response = await axios.get('https://api.ipify.org?format=json', {
      httpsAgent: agent,
      timeout: 5000,
    });
    if (response.data && (response.data as any).ip) {
      console.log('Proxy check successful, IP:', (response.data as any).ip);
      return res.status(200).json({ message: 'Proxy ใช้งานได้', ip: (response.data as any).ip });
    } else {
      console.error('Proxy check failed: No IP in response');
      return res.status(400).json({ message: 'ไม่สามารถใช้งาน Proxy นี้ได้: ไม่ได้รับข้อมูล IP' });
    }
  } catch (error: any) {
    console.error('Proxy check error:', error);
    let errorMessage = 'ไม่สามารถใช้งาน Proxy นี้ได้';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อถูกปฏิเสธ';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อหมดเวลา';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: ไม่พบที่อยู่ Host';
    } else if (error.message) {
      errorMessage = `ไม่สามารถใช้งาน Proxy นี้ได้: ${error.message}`;
    }
    return res.status(400).json({ message: errorMessage });
  }
};

export const receiveStatus = (req: Request, res: Response) => {
  console.log('▶️ receiveStatus called, body:', req.body);
  try {
    const { status, message, details } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'กรุณาระบุสถานะ' });
    }
    const phoneNumber = (details && (details as any).phoneNumber) || undefined;
    sendStatusUpdate(phoneNumber, status, message, details);
    return res.status(200).json({ message: 'Status received.' });
  } catch (error) {
    console.error('Error in receiveStatus:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการรับสถานะ' });
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    return res.status(200).json({ message: 'LINE app data cleared successfully.' });
  } catch (error) {
    console.error('Error in logout:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการล้างข้อมูลแอป LINE' });
  }
};

const sendStatusUpdate = (phoneNumber: string | undefined, status: string, message: string, details?: any) => {
  console.log(`🔔 Sending statusUpdate: phoneNumber=${phoneNumber}, status=${status}, message=${message}, details=`, details);
  if (wss) {
    console.log(`🔔 WebSocket clients count: ${wss.clients.size}`);
    wss.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({ type: 'statusUpdate', phoneNumber, status, message, details });
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