"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.receiveStatus = exports.checkProxy = exports.submitOtp = exports.registerLine = exports.testConnection = exports.setWebSocketServer = void 0;
const ws_1 = require("ws");
const LineAccount_1 = __importDefault(require("../models/LineAccount"));
const types_1 = require("../types");
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
const https_proxy_agent_1 = require("https-proxy-agent");
// สำหรับเก็บ WebSocket server instance
let wss;
// ตั้งค่า WebSocket server instance
const setWebSocketServer = (webSocketServer) => {
    wss = webSocketServer;
};
exports.setWebSocketServer = setWebSocketServer;
// สำหรับเก็บข้อมูล OTP ที่ได้รับจากผู้ใช้
let currentOtp = '';
// ทดสอบการเชื่อมต่อกับ API
const testConnection = (req, res) => {
    res.status(200).json({ message: 'สวัสดี! API Server สำหรับระบบ LINE Automation กำลังทำงานอยู่' });
};
exports.testConnection = testConnection;
// เริ่มกระบวนการลงทะเบียน
const registerLine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('▶️ registerLine called, body:', req.body);
    try {
        const { phoneNumber, displayName, password, proxy } = req.body;
        // ตรวจสอบว่ามีการกรอกข้อมูลที่จำเป็นครบถ้วนหรือไม่
        if (!phoneNumber || !displayName || !password) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }
        // ตรวจสอบว่าเบอร์โทรศัพท์นี้มีในระบบแล้วหรือยัง
        const existingAccount = yield LineAccount_1.default.findOne({ phoneNumber });
        if (existingAccount) {
            return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
        }
        // จำลองการเริ่มกระบวนการลงทะเบียน
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner
        sendStatusUpdate(phoneNumber, types_1.AutomationStatus.PROCESSING, 'กำลังเริ่มกระบวนการลงทะเบียน...');
        // หน่วงเวลาเพื่อจำลองการทำงาน
        setTimeout(() => {
            sendStatusUpdate(phoneNumber, types_1.AutomationStatus.AWAITING_OTP, 'โปรดกรอกรหัส OTP ที่ได้รับทาง SMS');
        }, 2000);
        return res.status(202).json({ message: 'Automation process started.' });
    }
    catch (error) {
        console.error('Error in registerLine:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเริ่มกระบวนการลงทะเบียน' });
    }
});
exports.registerLine = registerLine;
// รับและบันทึกค่า OTP
const submitOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('▶️ submitOtp called, body:', req.body);
    try {
        const { phoneNumber, otp } = req.body;
        if (!otp) {
            return res.status(400).json({ message: 'กรุณากรอกรหัส OTP' });
        }
        // บันทึกค่า OTP ที่ได้รับ
        currentOtp = otp;
        // จำลองกระบวนการตรวจสอบ OTP
        sendStatusUpdate(phoneNumber, types_1.AutomationStatus.PROCESSING, 'กำลังตรวจสอบรหัส OTP...');
        // หน่วงเวลาเพื่อจำลองการทำงาน
        setTimeout(() => {
            // สร้างบัญชีใหม่ (ในสถานการณ์จริงจะมีการตรวจสอบกับ LINE ก่อน และใช้ข้อมูลจริง)
            const newAccount = new LineAccount_1.default({
                phoneNumber,
                displayName: 'LINE User',
                password: 'password123',
                status: 'active',
            });
            newAccount.save();
            sendStatusUpdate(newAccount.phoneNumber, types_1.AutomationStatus.SUCCESS, 'ลงทะเบียนสำเร็จ', { accountId: newAccount._id });
        }, 2000);
        return res.status(200).json({ phoneNumber, message: 'OTP received and saved.' });
    }
    catch (error) {
        console.error('Error in submitOtp:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกรหัส OTP' });
    }
});
exports.submitOtp = submitOtp;
// เช็ก Proxy ว่าถูกต้องและใช้งานได้
const checkProxy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('▶️ checkProxy called, body:', req.body);
    const { proxy } = req.body;
    // ตรวจสอบว่ามีการส่ง Proxy มาหรือไม่
    if (!proxy || proxy.trim() === '') {
        return res.status(400).json({ message: 'กรุณากรอก Proxy' });
    }
    // ตรวจสอบรูปแบบของ Proxy
    let urlObj;
    try {
        urlObj = new url_1.URL(proxy);
    }
    catch (error) {
        console.error('Invalid proxy URL format:', error);
        return res.status(400).json({ message: 'รูปแบบ Proxy ไม่ถูกต้อง' });
    }
    // ตรวจสอบโปรโตคอลของ Proxy
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return res.status(400).json({ message: 'รูปแบบ Proxy ไม่ถูกต้อง โปรโตคอลต้องเป็น http หรือ https เท่านั้น' });
    }
    // ทดสอบการเช็ก proxy ผ่าน agent จริง
    try {
        const agent = new https_proxy_agent_1.HttpsProxyAgent(proxy);
        const response = yield axios_1.default.get('https://api.ipify.org?format=json', {
            httpsAgent: agent,
            timeout: 5000,
        });
        // ตรวจสอบว่าได้รับข้อมูล IP หรือไม่
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
        // จัดการข้อผิดพลาดให้ละเอียดมากขึ้น
        let errorMessage = 'ไม่สามารถใช้งาน Proxy นี้ได้';
        if (typeof error === 'object' && error !== null) {
            const errorObj = error;
            if (errorObj.code === 'ECONNREFUSED') {
                errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อถูกปฏิเสธ';
            }
            else if (errorObj.code === 'ECONNABORTED') {
                errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: การเชื่อมต่อหมดเวลา';
            }
            else if (errorObj.code === 'ENOTFOUND') {
                errorMessage = 'ไม่สามารถเชื่อมต่อกับ Proxy ได้: ไม่พบที่อยู่ Host';
            }
            else if (errorObj.message) {
                errorMessage = `ไม่สามารถใช้งาน Proxy นี้ได้: ${errorObj.message}`;
            }
        }
        return res.status(400).json({ message: errorMessage });
    }
});
exports.checkProxy = checkProxy;
// รับการอัปเดตสถานะจาก Automation Runner และส่งต่อให้ Frontend ผ่าน WebSocket
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
// สำหรับล้างข้อมูลแอป LINE (Logout)
const logout = (req, res) => {
    try {
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้ล้างข้อมูล
        return res.status(200).json({ message: 'LINE app data cleared successfully.' });
    }
    catch (error) {
        console.error('Error in logout:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการล้างข้อมูลแอป LINE' });
    }
};
exports.logout = logout;
// ฟังก์ชันสำหรับส่งข้อมูลสถานะผ่าน WebSocket
const sendStatusUpdate = (phoneNumber, status, message, details) => {
    console.log(`🔔 Sending statusUpdate: phoneNumber=${phoneNumber}, status=${status}, message=${message}, details=`, details);
    if (wss) {
        console.log(`🔔 WebSocket clients count: ${wss.clients.size}`);
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                const payload = JSON.stringify({
                    type: 'statusUpdate',
                    phoneNumber,
                    status,
                    message,
                    details,
                });
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
