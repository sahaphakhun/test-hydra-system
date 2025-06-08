"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobStatus = exports.getAllJobs = exports.deleteRegistrationRequest = exports.createAccountFromRequest = exports.updateRegistrationRequestStatus = exports.getRegistrationRequestById = exports.getAllRegistrationRequests = void 0;
const RegistrationRequest_1 = __importDefault(require("../models/RegistrationRequest"));
const LineAccount_1 = require("../models/LineAccount");
const Job_1 = __importDefault(require("../models/Job"));
const websocket_1 = require("../websocket");
const getAllRegistrationRequests = async (req, res) => {
    try {
        const requests = await RegistrationRequest_1.default.find().sort({ requestedAt: -1 });
        return res.status(200).json(requests);
    }
    catch (error) {
        console.error('Error fetching registration requests:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
    }
};
exports.getAllRegistrationRequests = getAllRegistrationRequests;
const getRegistrationRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const requestEntry = await RegistrationRequest_1.default.findById(id);
        if (!requestEntry) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        return res.status(200).json(requestEntry);
    }
    catch (error) {
        console.error('Error fetching registration request:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
    }
};
exports.getRegistrationRequestById = getRegistrationRequestById;
const updateRegistrationRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const requestEntry = await RegistrationRequest_1.default.findById(id);
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
        await requestEntry.save();
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', {
            message: `Registration request ${requestEntry._id} status updated`,
            requestId: requestEntry._id,
            status: requestEntry.status,
        });
        return res.status(200).json({ message: 'อัปเดตสถานะสำเร็จ', request: requestEntry });
    }
    catch (error) {
        console.error('Error updating registration request status:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
};
exports.updateRegistrationRequestStatus = updateRegistrationRequestStatus;
const createAccountFromRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { actualDisplayName, actualPassword } = req.body;
        const requestEntry = await RegistrationRequest_1.default.findById(id);
        if (!requestEntry) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        const existingAccount = await LineAccount_1.LineAccount.findOne({ phoneNumber: requestEntry.phoneNumber });
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
        await newAccount.save();
        requestEntry.status = 'completed';
        requestEntry.completedAt = new Date();
        await requestEntry.save();
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', {
            message: `Account created for request ${requestEntry._id}`,
            requestId: requestEntry._id,
            status: requestEntry.status,
        });
        return res.status(201).json({ message: 'สร้างบัญชีสำเร็จ', account: newAccount, request: requestEntry });
    }
    catch (error) {
        console.error('Error creating account from request:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
    }
};
exports.createAccountFromRequest = createAccountFromRequest;
const deleteRegistrationRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const requestEntry = await RegistrationRequest_1.default.findByIdAndDelete(id);
        if (!requestEntry) {
            return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
        }
        return res.status(200).json({ message: 'ลบคำขอลงทะเบียนสำเร็จ' });
    }
    catch (error) {
        console.error('Error deleting registration request:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบคำขอลงทะเบียน' });
    }
};
exports.deleteRegistrationRequest = deleteRegistrationRequest;
const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json(jobs);
    }
    catch (error) {
        console.error('Error fetching jobs:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการงาน' });
    }
};
exports.getAllJobs = getAllJobs;
const updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'ไม่พบงาน' });
        }
        job.status = status;
        await job.save();
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', { jobId: job._id, status });
        return res.status(200).json(job);
    }
    catch (error) {
        console.error('Error updating job status:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะงาน' });
    }
};
exports.updateJobStatus = updateJobStatus;
