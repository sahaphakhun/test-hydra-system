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
exports.deletePhoneNumberList = exports.createPhoneNumberList = exports.getPhoneNumberLists = exports.sendMessageToGroup = exports.createGroup = exports.addFriends = exports.getGroupsByAccountId = exports.getAccountById = exports.getAllAccounts = void 0;
const LineAccount_1 = require("../models/LineAccount");
const LineGroup_1 = __importDefault(require("../models/LineGroup"));
const PhoneNumberList_1 = __importDefault(require("../models/PhoneNumberList"));
const Job_1 = __importDefault(require("../models/Job"));
const websocket_1 = require("../websocket");
const createJob = (type, accountId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const job = new Job_1.default({ type, accountId, data });
    yield job.save();
    (0, websocket_1.broadcastMessage)('STATUS_UPDATE', { jobId: job._id, status: job.status });
    return job;
});
const updateJobStatus = (job, status, log) => __awaiter(void 0, void 0, void 0, function* () {
    job.status = status;
    if (log)
        job.logs.push(log);
    yield job.save();
    (0, websocket_1.broadcastMessage)('STATUS_UPDATE', { jobId: job._id, status });
});
const getAllAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield LineAccount_1.LineAccount.find().select('-password');
        return res.status(200).json(accounts);
    }
    catch (error) {
        console.error('Error in getAllAccounts:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการบัญชี' });
    }
});
exports.getAllAccounts = getAllAccounts;
const getAccountById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountId = req.params.id;
        const account = yield LineAccount_1.LineAccount.findById(accountId).select('-password');
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
        }
        return res.status(200).json(account);
    }
    catch (error) {
        console.error('Error in getAccountById:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี' });
    }
});
exports.getAccountById = getAccountById;
const getGroupsByAccountId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountId = req.params.accountId;
        const groups = yield LineGroup_1.default.find({ accountId });
        return res.status(200).json(groups);
    }
    catch (error) {
        console.error('Error in getGroupsByAccountId:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการกลุ่ม' });
    }
});
exports.getGroupsByAccountId = getGroupsByAccountId;
const addFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountId, phoneListId } = req.body;
        if (!accountId || !phoneListId) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        const list = yield PhoneNumberList_1.default.findById(phoneListId);
        if (!list) {
            return res.status(404).json({ message: 'ไม่พบชุดเบอร์โทรศัพท์' });
        }
        const numbers = list.chunks.flat();
        const job = yield createJob('add_friends', accountId, { numbers });
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้เพิ่มเพื่อน
        yield updateJobStatus(job, 'completed');
        return res.status(200).json({ message: `เพิ่มเพื่อนสำเร็จ ${numbers.length} รายการ`, addedCount: numbers.length, jobId: job._id });
    }
    catch (error) {
        console.error('Error in addFriends:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มเพื่อน' });
    }
});
exports.addFriends = addFriends;
const createGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, accountId } = req.body;
        if (!name || !accountId) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        const account = yield LineAccount_1.LineAccount.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ระบุ' });
        }
        const job = yield createJob('create_group', accountId, { name });
        const newGroup = new LineGroup_1.default({ name, accountId, memberCount: 0 });
        yield newGroup.save();
        yield updateJobStatus(job, 'completed');
        return res.status(201).json({ message: 'สร้างกลุ่มสำเร็จ', group: newGroup, jobId: job._id });
    }
    catch (error) {
        console.error('Error in createGroup:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกลุ่ม' });
    }
});
exports.createGroup = createGroup;
const sendMessageToGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountId, groupId, message } = req.body;
        if (!accountId || !groupId || !message) {
            return res.status(400).json({ message: 'กรุณาระบุ accountId, groupId และข้อความ' });
        }
        const account = yield LineAccount_1.LineAccount.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ระบุ' });
        }
        const group = yield LineGroup_1.default.findOne({ _id: groupId, accountId });
        if (!group) {
            return res.status(404).json({ message: 'ไม่พบกลุ่มที่ระบุ' });
        }
        const job = yield createJob('send_message', accountId, { groupId, message });
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้ส่งข้อความ
        yield updateJobStatus(job, 'completed');
        return res
            .status(200)
            .json({ message: 'ส่งข้อความสำเร็จ', sent: true, jobId: job._id });
    }
    catch (error) {
        console.error('Error in sendMessageToGroup:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
    }
});
exports.sendMessageToGroup = sendMessageToGroup;
const getPhoneNumberLists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lists = yield PhoneNumberList_1.default.find();
        return res.status(200).json(lists);
    }
    catch (error) {
        console.error('Error in getPhoneNumberLists:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการชุดเบอร์โทรศัพท์' });
    }
});
exports.getPhoneNumberLists = getPhoneNumberLists;
const createPhoneNumberList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield newList.save();
        return res.status(201).json({ message: 'สร้างชุดเบอร์โทรศัพท์สำเร็จ', list: newList });
    }
    catch (error) {
        console.error('Error in createPhoneNumberList:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างชุดเบอร์โทรศัพท์' });
    }
});
exports.createPhoneNumberList = createPhoneNumberList;
const deletePhoneNumberList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield PhoneNumberList_1.default.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'ไม่พบชุดเบอร์โทรศัพท์' });
        }
        return res.status(200).json({ message: 'ลบชุดเบอร์โทรศัพท์สำเร็จ' });
    }
    catch (error) {
        console.error('Error in deletePhoneNumberList:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบชุดเบอร์โทรศัพท์' });
    }
});
exports.deletePhoneNumberList = deletePhoneNumberList;
