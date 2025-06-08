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
exports.updateJobStatus = exports.getAllJobs = exports.deleteRegistrationRequest = exports.createAccountFromRequest = exports.updateRegistrationRequestStatus = exports.getRegistrationRequestById = exports.getAllRegistrationRequests = void 0;
const RegistrationRequest_1 = __importDefault(require("../models/RegistrationRequest"));
const LineAccount_1 = require("../models/LineAccount");
const Job_1 = __importDefault(require("../models/Job"));
const websocket_1 = require("../websocket");
const getAllRegistrationRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requests = yield RegistrationRequest_1.default.find().sort({ requestedAt: -1 });
        return res.status(200).json(requests);
    }
    catch (error) {
        console.error('Error fetching registration requests:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
    }
});
exports.getAllRegistrationRequests = getAllRegistrationRequests;
const getRegistrationRequestById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const requestEntry = yield RegistrationRequest_1.default.findById(id);
        if (!requestEntry) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        return res.status(200).json(requestEntry);
    }
    catch (error) {
        console.error('Error fetching registration request:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
    }
});
exports.getRegistrationRequestById = getRegistrationRequestById;
const updateRegistrationRequestStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const requestEntry = yield RegistrationRequest_1.default.findById(id);
        if (!requestEntry) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        requestEntry.status = status;
        if (adminNotes) {
            requestEntry.adminNotes = adminNotes;
        }
        if (status === 'completed') {
            requestEntry.completedAt = new Date();
        }
        yield requestEntry.save();
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', {
            message: `Registration request ${requestEntry._id} status updated`,
            requestId: requestEntry._id,
            phoneNumber: requestEntry.phoneNumber,
            status: requestEntry.status,
        });
        return res.status(200).json({ message: 'อัปเดตสถานะสำเร็จ', request: requestEntry });
    }
    catch (error) {
        console.error('Error updating registration request status:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
});
exports.updateRegistrationRequestStatus = updateRegistrationRequestStatus;
const createAccountFromRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { actualDisplayName, actualPassword } = req.body;
        const requestEntry = yield RegistrationRequest_1.default.findById(id);
        if (!requestEntry) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        const existingAccount = yield LineAccount_1.LineAccount.findOne({ phoneNumber: requestEntry.phoneNumber });
        if (existingAccount) {
            return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
        }
        const newAccount = new LineAccount_1.LineAccount({
            phoneNumber: requestEntry.phoneNumber,
            displayName: actualDisplayName || requestEntry.displayName,
            password: actualPassword || requestEntry.password,
            proxy: requestEntry.proxy,
            status: 'active',
        });
        yield newAccount.save();
        requestEntry.status = 'completed';
        requestEntry.completedAt = new Date();
        yield requestEntry.save();
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', {
            message: `Account created for request ${requestEntry._id}`,
            requestId: requestEntry._id,
            phoneNumber: requestEntry.phoneNumber,
            status: requestEntry.status,
        });
        return res.status(201).json({ message: 'สร้างบัญชีสำเร็จ', account: newAccount, request: requestEntry });
    }
    catch (error) {
        console.error('Error creating account from request:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
    }
});
exports.createAccountFromRequest = createAccountFromRequest;
const deleteRegistrationRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const requestEntry = yield RegistrationRequest_1.default.findByIdAndDelete(id);
        if (!requestEntry) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        return res.status(200).json({ message: 'ลบคำขอลงทะเบียนสำเร็จ' });
    }
    catch (error) {
        console.error('Error deleting registration request:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบคำขอลงทะเบียน' });
    }
});
exports.deleteRegistrationRequest = deleteRegistrationRequest;
const getAllJobs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield Job_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json(jobs);
    }
    catch (error) {
        console.error('Error fetching jobs:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการงาน' });
    }
});
exports.getAllJobs = getAllJobs;
const updateJobStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const job = yield Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'ไม่พบงาน' });
        }
        job.status = status;
        yield job.save();
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', { jobId: job._id, status });
        return res.status(200).json(job);
    }
    catch (error) {
        console.error('Error updating job status:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะงาน' });
    }
});
exports.updateJobStatus = updateJobStatus;
