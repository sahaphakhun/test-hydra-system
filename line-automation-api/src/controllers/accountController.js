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
exports.createPhoneNumberList = exports.getPhoneNumberLists = exports.sendMessageToGroup = exports.createGroup = exports.addFriends = exports.getGroupsByAccountId = exports.getAccountById = exports.getAllAccounts = void 0;
const LineAccount_1 = __importDefault(require("../models/LineAccount"));
const LineGroup_1 = __importDefault(require("../models/LineGroup"));
const PhoneNumberList_1 = __importDefault(require("../models/PhoneNumberList"));
// ดึงรายการบัญชี LINE ทั้งหมด
const getAllAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield LineAccount_1.default.find().select('-password');
        return res.status(200).json(accounts);
    }
    catch (error) {
        console.error('Error in getAllAccounts:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการบัญชี' });
    }
});
exports.getAllAccounts = getAllAccounts;
// ดึงรายละเอียดบัญชี LINE
const getAccountById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountId = req.params.id;
        const account = yield LineAccount_1.default.findById(accountId).select('-password');
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
// ดึงรายการกลุ่ม LINE ของบัญชีหนึ่งๆ
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
// เพิ่มเพื่อนจากเบอร์โทรศัพท์
const addFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountId, phoneNumbers } = req.body;
        if (!accountId || !phoneNumbers || phoneNumbers.length === 0) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        // ตรวจสอบว่าบัญชีที่ระบุมีอยู่จริงหรือไม่
        const account = yield LineAccount_1.default.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
        }
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้เพิ่มเพื่อน
        return res.status(200).json({
            message: `เพิ่มเพื่อนสำเร็จ ${phoneNumbers.length} เบอร์`,
            addedCount: phoneNumbers.length,
        });
    }
    catch (error) {
        console.error('Error in addFriends:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มเพื่อน' });
    }
});
exports.addFriends = addFriends;
// สร้างกลุ่ม LINE
const createGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountId, groupName } = req.body;
        if (!accountId || !groupName) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        // ตรวจสอบว่าบัญชีที่ระบุมีอยู่จริงหรือไม่
        const account = yield LineAccount_1.default.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
        }
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้สร้างกลุ่ม
        // สร้างกลุ่มใหม่ในฐานข้อมูล
        const newGroup = new LineGroup_1.default({
            name: groupName,
            accountId,
            memberCount: 1,
        });
        yield newGroup.save();
        return res.status(201).json({
            message: 'สร้างกลุ่มสำเร็จ',
            group: newGroup,
        });
    }
    catch (error) {
        console.error('Error in createGroup:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกลุ่ม' });
    }
});
exports.createGroup = createGroup;
// ส่งข้อความไปยังกลุ่ม LINE
const sendMessageToGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountId, groupId, message } = req.body;
        if (!accountId || !groupId || !message) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        // ตรวจสอบว่าบัญชีที่ระบุมีอยู่จริงหรือไม่
        const account = yield LineAccount_1.default.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
        }
        // ตรวจสอบว่ากลุ่มที่ระบุมีอยู่จริงหรือไม่
        const group = yield LineGroup_1.default.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'ไม่พบกลุ่มที่ต้องการ' });
        }
        // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้ส่งข้อความ
        return res.status(200).json({
            message: 'ส่งข้อความสำเร็จ',
            sentTo: group.name,
            sentFrom: account.displayName,
        });
    }
    catch (error) {
        console.error('Error in sendMessageToGroup:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
    }
});
exports.sendMessageToGroup = sendMessageToGroup;
// ดึงและจัดการรายการชุดเบอร์โทรศัพท์
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
// สร้างชุดเบอร์โทรศัพท์ใหม่
const createPhoneNumberList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, phoneNumbers, userId } = req.body;
        if (!name || !phoneNumbers || !userId) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }
        // สร้างชุดเบอร์โทรศัพท์ใหม่
        const newList = new PhoneNumberList_1.default({
            name,
            phoneNumbers,
            userId,
        });
        yield newList.save();
        return res.status(201).json({
            message: 'สร้างชุดเบอร์โทรศัพท์สำเร็จ',
            list: newList,
        });
    }
    catch (error) {
        console.error('Error in createPhoneNumberList:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างชุดเบอร์โทรศัพท์' });
    }
});
exports.createPhoneNumberList = createPhoneNumberList;
