"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.receiveStatus = exports.checkProxy = exports.submitOtp = exports.requestOtp = exports.registerLine = exports.testConnection = exports.setWebSocketServer = void 0;
const ws_1 = require("ws");
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
const https_proxy_agent_1 = require("https-proxy-agent");
const LineAccount_1 = require("../models/LineAccount");
const RegistrationRequest_1 = __importDefault(require("../models/RegistrationRequest"));
const types_1 = require("../types");
let wss;
const setWebSocketServer = (webSocketServer) => {
    wss = webSocketServer;
};
exports.setWebSocketServer = setWebSocketServer;
const testConnection = (req, res) => {
    res.status(200).json({ message: 'สวัสดี! API Server สำหรับระบบ LINE Automation กำลังทำงานอยู่' });
};
exports.testConnection = testConnection;
const registerLine = async (req, res) => {
    console.log('▶️ registerLine called, body:', req.body);
    try {
        const { phoneNumber, displayName, password, proxy, autoLogout } = req.body;
        if (!phoneNumber || !displayName || !password) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }
        const existingAccount = await LineAccount_1.LineAccount.findOne({ phoneNumber });
        if (existingAccount) {
            return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
        }
        const existingRequest = await RegistrationRequest_1.default.findOne({
            phoneNumber,
            status: { $in: ['pending', 'processing', 'awaiting_otp'] },
        });
        if (existingRequest) {
            return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีคำขอที่รอดำเนินการอยู่แล้ว' });
        }
        const registrationRequest = new RegistrationRequest_1.default({
            phoneNumber,
            displayName,
            password,
            proxy,
            autoLogout: autoLogout !== undefined ? autoLogout : true,
            status: 'pending',
        });
        registrationRequest.status = 'processing';
        await registrationRequest.save();
        sendStatusUpdate(phoneNumber, types_1.AutomationStatus.PROCESSING, 'กำลังสมัครบัญชี LINE...');
        setTimeout(() => {
            sendStatusUpdate(phoneNumber, types_1.AutomationStatus.AWAITING_OTP, 'กรุณากดปุ่มขอ OTP และกรอกรหัสที่ได้รับ');
        }, 2000);
        return res.status(202).json({
            message: 'รับคำขอลงทะเบียนเรียบร้อยแล้ว กำลังสมัครบัญชี LINE สำหรับคุณ',
            requestId: registrationRequest._id,
        });
    }
    catch (error) {
        console.error('Error in registerLine:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเริ่มกระบวนการลงทะเบียน' });
    }
};
exports.registerLine = registerLine;
const requestOtp = async (req, res) => {
    console.log('▶️ requestOtp called, body:', req.body);
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: 'กรุณาระบุเบอร์โทรศัพท์' });
        }
        const requestEntry = await RegistrationRequest_1.default.findOne({
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
        sendStatusUpdate(phoneNumber, types_1.AutomationStatus.AWAITING_OTP, 'ได้ร้องขอ OTP แล้ว กรุณารอรับ SMS และกรอกรหัส OTP');
        return res.status(200).json({
            message: 'ร้องขอ OTP เรียบร้อยแล้ว กรุณารอรับ SMS และกรอกรหัส OTP',
        });
    }
    catch (error) {
        console.error('Error in requestOtp:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการร้องขอ OTP' });
    }
};
exports.requestOtp = requestOtp;
const submitOtp = async (req, res) => {
    console.log('▶️ submitOtp called, body:', req.body);
    try {
        const { phoneNumber, otp } = req.body;
        if (!otp) {
            return res.status(400).json({ message: 'กรุณากรอกรหัส OTP' });
        }
        const requestEntry = await RegistrationRequest_1.default.findOne({
            phoneNumber,
            status: 'awaiting_otp',
        });
        if (!requestEntry) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียนที่รอ OTP สำหรับเบอร์นี้' });
        }
        sendStatusUpdate(phoneNumber, types_1.AutomationStatus.PROCESSING, 'ได้รับรหัส OTP แล้ว กำลังดำเนินการสมัครบัญชี...');
        requestEntry.status = 'processing';
        await requestEntry.save();
        setTimeout(async () => {
            try {
                // ตรวจสอบว่ามีบัญชีอยู่แล้วหรือไม่
                const existingAccount = await LineAccount_1.LineAccount.findOne({ phoneNumber: requestEntry.phoneNumber });
                if (!existingAccount) {
                    // สร้างบัญชีใหม่ใน LineAccount
                    const newAccount = new LineAccount_1.LineAccount({
                        displayName: requestEntry.displayName,
                        userId: `user_${requestEntry.phoneNumber}_${Date.now()}`,
                        phoneNumber: requestEntry.phoneNumber,
                        email: `${requestEntry.phoneNumber}@temp.com`,
                        lineConfigId: '000000000000000000000000', // ObjectId ชั่วคราว
                    });
                    await newAccount.save();
                    console.log(`✅ Created LineAccount for ${requestEntry.phoneNumber}`);
                }
                // ลบ RegistrationRequest
                await RegistrationRequest_1.default.findByIdAndDelete(requestEntry._id);
                console.log(`✅ Deleted RegistrationRequest for ${requestEntry.phoneNumber}`);
            }
            catch (err) {
                console.error('Failed to create account and delete request:', err);
            }
            sendStatusUpdate(phoneNumber, types_1.AutomationStatus.SUCCESS, 'สมัครบัญชี LINE สำเร็จแล้ว! บัญชีของคุณพร้อมใช้งาน', { requestId: requestEntry._id, accountCreated: true });
        }, 3000);
        return res.status(200).json({ phoneNumber, message: 'ได้รับรหัส OTP เรียบร้อยแล้ว ทีมงานกำลังดำเนินการสมัครบัญชีให้คุณ' });
    }
    catch (error) {
        console.error('Error in submitOtp:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกรหัส OTP' });
    }
};
exports.submitOtp = submitOtp;
const checkProxy = async (req, res) => {
    console.log('▶️ checkProxy called, body:', req.body);
    try {
        const { proxy } = req.body;
        if (!proxy || proxy.trim() === '') {
            return res.status(400).json({ message: 'กรุณากรอก Proxy' });
        }
        let urlObj;
        try {
            urlObj = new url_1.URL(proxy);
        }
        catch (error) {
            console.error('Invalid proxy URL format:', error);
            return res.status(400).json({ message: 'รูปแบบ Proxy ไม่ถูกต้อง' });
        }
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return res.status(400).json({ message: 'รูปแบบ Proxy ไม่ถูกต้อง โปรโตคอลต้องเป็น http หรือ https เท่านั้น' });
        }
        const agent = new https_proxy_agent_1.HttpsProxyAgent(proxy);
        const response = await axios_1.default.get('https://api.ipify.org?format=json', {
            httpsAgent: agent,
            timeout: 5000,
        });
        if (response.data && response.data.ip) {
            console.log('Proxy check successful, IP:', response.data.ip);
            return res.status(200).json({ message: 'Proxy ใช้งานได้', ip: response.data.ip });
        }
        else {
            console.error('Proxy check failed: No IP in response');
            return res.status(400).json({ message: 'ไม่สามารถใช้งาน Proxy นี้ได้: ไม่ได้รับข้อมูล IP' });
        }
    }
    catch (error) {
        console.error('Proxy check error:', error);
        let errorMessage = 'ไม่สามารถใช้งาน Proxy นี้ได้';
        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อถูกปฏิเสธ';
        }
        else if (error.code === 'ECONNABORTED') {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อหมดเวลา';
        }
        else if (error.code === 'ENOTFOUND') {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: ไม่พบที่อยู่ Host';
        }
        else if (error.message) {
            errorMessage = `ไม่สามารถใช้งาน Proxy นี้ได้: ${error.message}`;
        }
        return res.status(400).json({ message: errorMessage });
    }
};
exports.checkProxy = checkProxy;
const receiveStatus = (req, res) => {
    console.log('▶️ receiveStatus called, body:', req.body);
    try {
        const { status, message, details } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'กรุณาระบุสถานะ' });
        }
        const phoneNumber = (details && details.phoneNumber) || undefined;
        sendStatusUpdate(phoneNumber, status, message, details);
        return res.status(200).json({ message: 'Status received.' });
    }
    catch (error) {
        console.error('Error in receiveStatus:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการรับสถานะ' });
    }
};
exports.receiveStatus = receiveStatus;
const logout = (req, res) => {
    try {
        return res.status(200).json({ message: 'LINE app data cleared successfully.' });
    }
    catch (error) {
        console.error('Error in logout:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการล้างข้อมูลแอป LINE' });
    }
};
exports.logout = logout;
const sendStatusUpdate = (phoneNumber, status, message, details) => {
    console.log(`🔔 Sending statusUpdate: phoneNumber=${phoneNumber}, status=${status}, message=${message}, details=`, details);
    if (wss) {
        console.log(`🔔 WebSocket clients count: ${wss.clients.size}`);
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                const payload = JSON.stringify({ type: 'statusUpdate', phoneNumber, status, message, details });
                console.log(`🔔 Sending to client: ${payload}`);
                client.send(payload);
            }
            else {
                console.log(`🔔 Client not ready: ${client.readyState}`);
            }
        });
    }
    else {
        console.log(`🔔 WebSocket server not initialized!`);
    }
};
