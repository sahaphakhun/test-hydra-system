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
exports.messageTemplateRoutes = void 0;
const express_1 = __importDefault(require("express"));
const messageTemplate_1 = require("../models/messageTemplate");
const router = express_1.default.Router();
// รับเทมเพลตข้อความทั้งหมด
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, tag, limit = 10, page = 1 } = req.query;
        // สร้างตัวกรอง
        const filter = {};
        // กรองตามประเภท
        if (type) {
            filter.type = type;
        }
        // กรองตามแท็ก
        if (tag) {
            filter.tags = tag;
        }
        // คำนวณการข้ามข้อมูล
        const skip = (Number(page) - 1) * Number(limit);
        // ดึงข้อมูลเทมเพลตข้อความ
        const messageTemplates = yield messageTemplate_1.MessageTemplate.find(filter)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        // นับจำนวนเทมเพลตทั้งหมด
        const total = yield messageTemplate_1.MessageTemplate.countDocuments(filter);
        res.status(200).json({
            success: true,
            data: messageTemplates,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('❌ ข้อผิดพลาดในการรับเทมเพลตข้อความ:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับเทมเพลตข้อความ' });
    }
}));
// รับเทมเพลตข้อความตาม ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messageTemplate = yield messageTemplate_1.MessageTemplate.findById(req.params.id);
        if (!messageTemplate) {
            return res.status(404).json({ success: false, message: 'ไม่พบเทมเพลตข้อความ' });
        }
        res.status(200).json({ success: true, data: messageTemplate });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการรับเทมเพลตข้อความ ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับเทมเพลตข้อความ' });
    }
}));
// สร้างเทมเพลตข้อความใหม่
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, type, content, tags } = req.body;
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!name || !type || !content) {
            return res.status(400).json({
                success: false,
                message: 'ต้องระบุชื่อ, ประเภทและเนื้อหาข้อความ'
            });
        }
        // ตรวจสอบประเภทข้อความ
        if (!Object.values(messageTemplate_1.MessageType).includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'ประเภทข้อความไม่ถูกต้อง'
            });
        }
        // ตรวจสอบว่ามีชื่อซ้ำหรือไม่
        const existingTemplate = yield messageTemplate_1.MessageTemplate.findOne({ name });
        if (existingTemplate) {
            return res.status(400).json({ success: false, message: 'ชื่อเทมเพลตนี้มีอยู่แล้ว' });
        }
        // สร้างเทมเพลตใหม่
        const messageTemplate = yield messageTemplate_1.MessageTemplate.create({
            name,
            description,
            type,
            content,
            tags: tags || []
        });
        res.status(201).json({ success: true, data: messageTemplate });
    }
    catch (error) {
        console.error('❌ ข้อผิดพลาดในการสร้างเทมเพลตข้อความ:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างเทมเพลตข้อความ' });
    }
}));
// อัปเดตเทมเพลตข้อความ
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, type, content, tags } = req.body;
        // ตรวจสอบว่ามีเทมเพลตที่ต้องการอัปเดตหรือไม่
        const messageTemplate = yield messageTemplate_1.MessageTemplate.findById(req.params.id);
        if (!messageTemplate) {
            return res.status(404).json({ success: false, message: 'ไม่พบเทมเพลตข้อความ' });
        }
        // ตรวจสอบชื่อซ้ำ (ถ้ามีการเปลี่ยนชื่อ)
        if (name && name !== messageTemplate.name) {
            const existingTemplate = yield messageTemplate_1.MessageTemplate.findOne({ name });
            if (existingTemplate) {
                return res.status(400).json({ success: false, message: 'ชื่อเทมเพลตนี้มีอยู่แล้ว' });
            }
        }
        // ตรวจสอบประเภทข้อความ
        if (type && !Object.values(messageTemplate_1.MessageType).includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'ประเภทข้อความไม่ถูกต้อง'
            });
        }
        // อัปเดตฟิลด์
        if (name)
            messageTemplate.name = name;
        if (description !== undefined)
            messageTemplate.description = description;
        if (type)
            messageTemplate.type = type;
        if (content)
            messageTemplate.content = content;
        if (tags)
            messageTemplate.tags = tags;
        yield messageTemplate.save();
        res.status(200).json({ success: true, data: messageTemplate });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการอัปเดตเทมเพลตข้อความ ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตเทมเพลตข้อความ' });
    }
}));
// ลบเทมเพลตข้อความ
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messageTemplate = yield messageTemplate_1.MessageTemplate.findByIdAndDelete(req.params.id);
        if (!messageTemplate) {
            return res.status(404).json({ success: false, message: 'ไม่พบเทมเพลตข้อความ' });
        }
        res.status(200).json({ success: true, message: 'ลบเทมเพลตข้อความสำเร็จ' });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการลบเทมเพลตข้อความ ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเทมเพลตข้อความ' });
    }
}));
exports.messageTemplateRoutes = router;
