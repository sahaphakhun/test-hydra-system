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
exports.logout = exports.receiveStatus = exports.getPendingRegistrations = exports.submitOtp = exports.requestOtp = exports.registerLine = exports.testConnection = exports.setWebSocketServer = void 0;
const ws_1 = require("ws");
const LineAccount_1 = __importDefault(require("../models/LineAccount"));
const types_1 = require("../types");
// สำหรับเก็บ WebSocket server instance
let wss;
// ตั้งค่า WebSocket server instance
const setWebSocketServer = (webSocketServer) => {
    wss = webSocketServer;
};
exports.setWebSocketServer = setWebSocketServer;
// สำหรับเก็บข้อมูล OTP ที่ได้รับจากผู้ใช้
let currentOtp = '';
let pendingRegistrations = new Map();
// ทดสอบการเชื่อมต่อกับ API
const testConnection = (req, res) => {
    res.status(200).json({ message: 'สวัสดี! API Server สำหรับระบบ LINE Automation กำลังทำงานอยู่' });
};
exports.testConnection = testConnection;
// เริ่มกระบวนการลงทะเบียน - เก็บข้อมูลไว้ใน dashboard แอดมิน
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
        // เก็บข้อมูลการลงทะเบียนไว้ใน memory สำหรับแอดมิน
        const registrationData = {
            phoneNumber,
            displayName,
            password,
            proxy,
            status: 'pending',
            createdAt: new Date(),
            otpRequested: false
        };
        pendingRegistrations.set(phoneNumber, registrationData);
        console.log('📝 เก็บข้อมูลการลงทะเบียนสำหรับแอดมิน:', registrationData);
        // แสดงข้อความ "กำลังสมัคร" แทนการเรียก API จริง
        sendStatusUpdate(types_1.AutomationStatus.PROCESSING, 'กำลังสมัคร...', { phoneNumber });
        // จำลองการรอสักครู่แล้วแสดงสถานะรอ OTP
        setTimeout(() => {
            // อัปเดตสถานะเป็นรอ OTP
            const registration = pendingRegistrations.get(phoneNumber);
            if (registration) {
                registration.status = 'waiting_otp';
                pendingRegistrations.set(phoneNumber, registration);
            }
            sendStatusUpdate(types_1.AutomationStatus.WAITING_OTP, 'กรุณาขอรหัส OTP และกรอกรหัสที่ได้รับ', { phoneNumber });
        }, 2000);
        return res.status(202).json({ message: 'Registration data saved for admin processing.' });
    }
    catch (error) {
        console.error('Error in registerLine:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเริ่มกระบวนการลงทะเบียน' });
    }
});
exports.registerLine = registerLine;
// ฟังก์ชันสำหรับผู้ใช้ขอ OTP
const requestOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('▶️ requestOtp called, body:', req.body);
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: 'กรุณาระบุเบอร์โทรศัพท์' });
        }
        // ตรวจสอบว่ามีข้อมูลการลงทะเบียนหรือไม่
        const registration = pendingRegistrations.get(phoneNumber);
        if (!registration) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการลงทะเบียน' });
        }
        // อัปเดตสถานะว่าได้ขอ OTP แล้ว
        registration.otpRequested = true;
        pendingRegistrations.set(phoneNumber, registration);
        console.log('📱 ผู้ใช้ขอ OTP สำหรับเบอร์:', phoneNumber);
        // ส่งสถานะอัปเดตให้ frontend
        sendStatusUpdate(types_1.AutomationStatus.PROCESSING, 'ได้ขอ OTP แล้ว กรุณารอรับ SMS และกรอกรหัส OTP', { phoneNumber });
        return res.status(200).json({ message: 'OTP request recorded successfully.' });
    }
    catch (error) {
        console.error('Error in requestOtp:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการขอ OTP' });
    }
});
exports.requestOtp = requestOtp;
// รับและบันทึกค่า OTP
const submitOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('▶️ submitOtp called, body:', req.body);
    try {
        const { phoneNumber, otp } = req.body;
        if (!otp || !phoneNumber) {
            return res.status(400).json({ message: 'กรุณากรอกรหัส OTP และระบุเบอร์โทรศัพท์' });
        }
        // ตรวจสอบว่ามีข้อมูลการลงทะเบียนหรือไม่
        const registration = pendingRegistrations.get(phoneNumber);
        if (!registration) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการลงทะเบียน' });
        }
        // บันทึกค่า OTP ที่ได้รับ
        currentOtp = otp;
        console.log('📝 บันทึก OTP สำหรับเบอร์:', phoneNumber, 'OTP:', otp);
        // จำลองกระบวนการตรวจสอบ OTP
        sendStatusUpdate(types_1.AutomationStatus.PROCESSING, 'กำลังตรวจสอบรหัส OTP...', { phoneNumber });
        // หน่วงเวลาเพื่อจำลองการทำงาน
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // สร้างบัญชีใหม่ในฐานข้อมูล
                const newAccount = new LineAccount_1.default({
                    phoneNumber: registration.phoneNumber,
                    displayName: registration.displayName,
                    password: registration.password,
                    proxy: registration.proxy,
                    status: 'active',
                });
                yield newAccount.save();
                // อัปเดตสถานะการลงทะเบียนเป็นเสร็จสิ้น
                registration.status = 'completed';
                pendingRegistrations.set(phoneNumber, registration);
                console.log('✅ สร้างบัญชีสำเร็จ:', newAccount._id);
                sendStatusUpdate(types_1.AutomationStatus.SUCCESS, 'ลงทะเบียนสำเร็จ', { accountId: newAccount._id, phoneNumber });
                // ลบข้อมูลการลงทะเบียนออกจาก memory หลังเสร็จสิ้น
                setTimeout(() => {
                    pendingRegistrations.delete(phoneNumber);
                }, 5000);
            }
            catch (error) {
                console.error('Error creating account:', error);
                registration.status = 'failed';
                pendingRegistrations.set(phoneNumber, registration);
                sendStatusUpdate(types_1.AutomationStatus.ERROR, 'เกิดข้อผิดพลาดในการสร้างบัญชี', { phoneNumber });
            }
        }), 2000);
        return res.status(200).json({ message: 'OTP received and processing.' });
    }
    catch (error) {
        console.error('Error in submitOtp:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกรหัส OTP' });
    }
});
exports.submitOtp = submitOtp;
// API สำหรับแอดมินดูข้อมูลการลงทะเบียนที่รอดำเนินการ
const getPendingRegistrations = (req, res) => {
    try {
        const registrations = Array.from(pendingRegistrations.values());
        return res.status(200).json({ registrations });
    }
    catch (error) {
        console.error('Error in getPendingRegistrations:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};
exports.getPendingRegistrations = getPendingRegistrations;
// รับการอัปเดตสถานะจาก Automation Runner และส่งต่อให้ Frontend ผ่าน WebSocket
const receiveStatus = (req, res) => {
    console.log('▶️ receiveStatus called, body:', req.body);
    try {
        const { status, message, details } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'กรุณาระบุสถานะ' });
        }
        sendStatusUpdate(status, message, details);
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
const sendStatusUpdate = (status, message, details) => {
    console.log(`🔔 Sending statusUpdate: status=${status}, message=${message}, details=`, details);
    if (wss) {
        console.log(`🔔 WebSocket clients count: ${wss.clients.size}`);
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                const payload = JSON.stringify({
                    type: 'statusUpdate',
                    status,
                    message,
                    details,
                    phoneNumber: details === null || details === void 0 ? void 0 : details.phoneNumber, // เพิ่ม phoneNumber ใน payload
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
