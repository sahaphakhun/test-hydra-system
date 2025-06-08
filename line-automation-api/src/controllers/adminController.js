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
exports.deleteRegistrationRequest = exports.createAccountFromRequest = exports.updateRegistrationRequestStatus = exports.getRegistrationRequestById = exports.getAllRegistrationRequests = void 0;
const RegistrationRequest_1 = __importDefault(require("../models/RegistrationRequest"));
const LineAccount_1 = __importDefault(require("../models/LineAccount"));
// ดูคำขอลงทะเบียนทั้งหมด
const getAllRegistrationRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requests = yield RegistrationRequest_1.default.find()
            .sort({ requestedAt: -1 });
        res.status(200).json(requests);
    }
    catch (error) {
        console.error('Error fetching registration requests:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
    }
});
exports.getAllRegistrationRequests = getAllRegistrationRequests;
// ดูคำขอลงทะเบียนตาม ID
const getRegistrationRequestById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const request = yield RegistrationRequest_1.default.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        res.status(200).json(request);
    }
    catch (error) {
        console.error('Error fetching registration request:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
    }
});
exports.getRegistrationRequestById = getRegistrationRequestById;
// อัปเดตสถานะคำขอลงทะเบียน
const updateRegistrationRequestStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const request = yield RegistrationRequest_1.default.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        request.status = status;
        if (adminNotes) {
            request.adminNotes = adminNotes;
        }
        if (status === 'completed') {
            request.completedAt = new Date();
        }
        yield request.save();
        res.status(200).json({ message: 'อัปเดตสถานะสำเร็จ', request });
    }
    catch (error) {
        console.error('Error updating registration request status:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
});
exports.updateRegistrationRequestStatus = updateRegistrationRequestStatus;
// สร้างบัญชี LINE จากคำขอลงทะเบียน
const createAccountFromRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { actualDisplayName, actualPassword } = req.body;
        const request = yield RegistrationRequest_1.default.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        // ตรวจสอบว่าเบอร์โทรศัพท์นี้มีในระบบแล้วหรือยัง
        const existingAccount = yield LineAccount_1.default.findOne({ phoneNumber: request.phoneNumber });
        if (existingAccount) {
            return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
        }
        // สร้างบัญชีใหม่
        const newAccount = new LineAccount_1.default({
            phoneNumber: request.phoneNumber,
            displayName: actualDisplayName || request.displayName,
            password: actualPassword || request.password,
            proxy: request.proxy,
            status: 'active',
        });
        yield newAccount.save();
        // อัปเดตสถานะคำขอเป็น completed
        request.status = 'completed';
        request.completedAt = new Date();
        yield request.save();
        res.status(201).json({
            message: 'สร้างบัญชีสำเร็จ',
            account: newAccount,
            request: request
        });
    }
    catch (error) {
        console.error('Error creating account from request:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
    }
});
exports.createAccountFromRequest = createAccountFromRequest;
// ลบคำขอลงทะเบียน
const deleteRegistrationRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const request = yield RegistrationRequest_1.default.findByIdAndDelete(id);
        if (!request) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        res.status(200).json({ message: 'ลบคำขอลงทะเบียนสำเร็จ' });
    }
    catch (error) {
        console.error('Error deleting registration request:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบคำขอลงทะเบียน' });
    }
});
exports.deleteRegistrationRequest = deleteRegistrationRequest;
