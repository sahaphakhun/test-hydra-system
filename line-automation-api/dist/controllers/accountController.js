"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobStatus = exports.getJobById = exports.getJobs = exports.deletePhoneNumberList = exports.createPhoneNumberList = exports.getPhoneNumberLists = exports.sendMessageToGroup = exports.deleteGroup = exports.createGroup = exports.addFriends = exports.getGroupsByAccountId = exports.getAccountById = exports.getAllAccounts = void 0;
const LineAccount_1 = require("../models/LineAccount");
const LineGroup_1 = __importDefault(require("../models/LineGroup"));
const PhoneNumberList_1 = __importDefault(require("../models/PhoneNumberList"));
const Job_1 = __importDefault(require("../models/Job"));
const websocket_1 = require("../websocket");
const createJob = async (type, accountId, data) => {
    const job = new Job_1.default({ type, accountId, data });
    await job.save();
    (0, websocket_1.broadcastMessage)('STATUS_UPDATE', { jobId: job._id, status: job.status });
    return job;
};
const updateJobStatusInternal = async (job, status, log) => {
    job.status = status;
    if (log)
        job.logs.push(log);
    await job.save();
    (0, websocket_1.broadcastMessage)('STATUS_UPDATE', { jobId: job._id, status });
};
const getAllAccounts = async (req, res) => {
    try {
        const accounts = await LineAccount_1.LineAccount.find().select('-password');
        return res.status(200).json(accounts);
    }
    catch (error) {
        console.error('Error in getAllAccounts:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการบัญชี' });
    }
};
exports.getAllAccounts = getAllAccounts;
const getAccountById = async (req, res) => {
    try {
        const accountId = req.params.id;
        const account = await LineAccount_1.LineAccount.findById(accountId).select('-password');
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
        }
        return res.status(200).json(account);
    }
    catch (error) {
        console.error('Error in getAccountById:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี' });
    }
};
exports.getAccountById = getAccountById;
const getGroupsByAccountId = async (req, res) => {
    try {
        const accountId = req.params.accountId;
        const groups = await LineGroup_1.default.find({ accountId });
        return res.status(200).json(groups);
    }
    catch (error) {
        console.error('Error in getGroupsByAccountId:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการกลุ่ม' });
    }
};
exports.getGroupsByAccountId = getGroupsByAccountId;
const addFriends = async (req, res) => {
    try {
        const { accountId, phoneListId } = req.body;
        if (!accountId || !phoneListId) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        const list = await PhoneNumberList_1.default.findById(phoneListId);
        if (!list) {
            return res.status(404).json({ message: 'ไม่พบชุดเบอร์โทรศัพท์' });
        }
        const numbers = list.chunks.flat();
        const job = await createJob('add_friends', accountId, { numbers });
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้เพิ่มเพื่อน
        await updateJobStatusInternal(job, 'completed');
        return res.status(200).json({ message: `เพิ่มเพื่อนสำเร็จ ${numbers.length} รายการ`, addedCount: numbers.length, jobId: job._id });
    }
    catch (error) {
        console.error('Error in addFriends:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มเพื่อน' });
    }
};
exports.addFriends = addFriends;
const createGroup = async (req, res) => {
    try {
        const { name, accountId } = req.body;
        if (!name || !accountId) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        const account = await LineAccount_1.LineAccount.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ระบุ' });
        }
        const job = await createJob('create_group', accountId, { name });
        const newGroup = new LineGroup_1.default({ name, accountId, memberCount: 0 });
        await newGroup.save();
        await updateJobStatusInternal(job, 'completed');
        return res.status(201).json({ message: 'สร้างกลุ่มสำเร็จ', group: newGroup, jobId: job._id });
    }
    catch (error) {
        console.error('Error in createGroup:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกลุ่ม' });
    }
};
exports.createGroup = createGroup;
const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedGroup = await LineGroup_1.default.findByIdAndDelete(id);
        if (!deletedGroup) {
            return res.status(404).json({ message: 'ไม่พบกลุ่มที่ระบุ' });
        }
        return res.status(200).json({ message: 'ลบกลุ่มสำเร็จ' });
    }
    catch (error) {
        console.error('Error in deleteGroup:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบกลุ่ม' });
    }
};
exports.deleteGroup = deleteGroup;
const sendMessageToGroup = async (req, res) => {
    try {
        const { accountId, groupId, message } = req.body;
        if (!accountId || !groupId || !message) {
            return res.status(400).json({ message: 'กรุณาระบุ accountId, groupId และข้อความ' });
        }
        const account = await LineAccount_1.LineAccount.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ระบุ' });
        }
        const group = await LineGroup_1.default.findOne({ _id: groupId, accountId });
        if (!group) {
            return res.status(404).json({ message: 'ไม่พบกลุ่มที่ระบุ' });
        }
        const job = await createJob('send_message', accountId, { groupId, message });
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้ส่งข้อความ
        await updateJobStatusInternal(job, 'completed');
        return res
            .status(200)
            .json({ message: 'ส่งข้อความสำเร็จ', sent: true, jobId: job._id });
    }
    catch (error) {
        console.error('Error in sendMessageToGroup:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
    }
};
exports.sendMessageToGroup = sendMessageToGroup;
const getPhoneNumberLists = async (req, res) => {
    try {
        const lists = await PhoneNumberList_1.default.find();
        return res.status(200).json(lists);
    }
    catch (error) {
        console.error('Error in getPhoneNumberLists:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการชุดเบอร์โทรศัพท์' });
    }
};
exports.getPhoneNumberLists = getPhoneNumberLists;
const createPhoneNumberList = async (req, res) => {
    try {
        // chunks should already be grouped by the client
        const { name, inputType, rawData, chunks } = req.body;
        if (!name || !inputType || !chunks || !Array.isArray(chunks)) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        const newList = new PhoneNumberList_1.default({
            name,
            inputType,
            rawData,
            chunks,
            userId: '',
        });
        await newList.save();
        return res.status(201).json({ message: 'สร้างชุดเบอร์โทรศัพท์สำเร็จ', list: newList });
    }
    catch (error) {
        console.error('Error in createPhoneNumberList:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างชุดเบอร์โทรศัพท์' });
    }
};
exports.createPhoneNumberList = createPhoneNumberList;
const deletePhoneNumberList = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedList = await PhoneNumberList_1.default.findByIdAndDelete(id);
        if (!deletedList) {
            return res.status(404).json({ message: 'ไม่พบชุดเบอร์โทรศัพท์' });
        }
        return res.status(200).json({ message: 'ลบชุดเบอร์โทรศัพท์สำเร็จ' });
    }
    catch (error) {
        console.error('Error in deletePhoneNumberList:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบชุดเบอร์โทรศัพท์' });
    }
};
exports.deletePhoneNumberList = deletePhoneNumberList;
// การจัดการงาน (Jobs)
const getJobs = async (req, res) => {
    try {
        const { type, accountId, status } = req.query;
        const filter = {};
        if (type)
            filter.type = type;
        if (accountId)
            filter.accountId = accountId;
        if (status)
            filter.status = status;
        const jobs = await Job_1.default.find(filter).sort({ createdAt: -1 });
        return res.status(200).json(jobs);
    }
    catch (error) {
        console.error('Error in getJobs:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน' });
    }
};
exports.getJobs = getJobs;
const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'ไม่พบงานที่ระบุ' });
        }
        return res.status(200).json(job);
    }
    catch (error) {
        console.error('Error in getJobById:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน' });
    }
};
exports.getJobById = getJobById;
const updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, log } = req.body;
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'ไม่พบงานที่ระบุ' });
        }
        job.status = status;
        if (log) {
            job.logs.push(log);
        }
        await job.save();
        // ส่ง WebSocket update
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', { jobId: job._id, status: job.status });
        return res.status(200).json({ message: 'อัปเดตสถานะงานสำเร็จ', job });
    }
    catch (error) {
        console.error('Error in updateJobStatus:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะงาน' });
    }
};
exports.updateJobStatus = updateJobStatus;
