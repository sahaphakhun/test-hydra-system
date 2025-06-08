"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineConfigRoutes = void 0;
const express_1 = __importDefault(require("express"));
const lineConfig_1 = require("../models/lineConfig");
const router = express_1.default.Router();
// รับการตั้งค่า LINE ทั้งหมด
router.get('/', async (req, res) => {
    try {
        const lineConfigs = await lineConfig_1.LineConfig.find().select('-channelSecret -channelAccessToken');
        res.status(200).json({ success: true, data: lineConfigs });
    }
    catch (error) {
        console.error('❌ ข้อผิดพลาดในการรับการตั้งค่า LINE:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับการตั้งค่า LINE' });
    }
});
// รับการตั้งค่า LINE ตาม ID
router.get('/:id', async (req, res) => {
    try {
        const lineConfig = await lineConfig_1.LineConfig.findById(req.params.id).select('-channelSecret -channelAccessToken');
        if (!lineConfig) {
            return res.status(404).json({ success: false, message: 'ไม่พบการตั้งค่า LINE' });
        }
        res.status(200).json({ success: true, data: lineConfig });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการรับการตั้งค่า LINE ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับการตั้งค่า LINE' });
    }
});
// สร้างการตั้งค่า LINE ใหม่
router.post('/', async (req, res) => {
    try {
        const { name, channelId, channelSecret, channelAccessToken } = req.body;
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!name || !channelId || !channelSecret || !channelAccessToken) {
            return res.status(400).json({
                success: false,
                message: 'ต้องระบุชื่อ, Channel ID, Channel Secret และ Channel Access Token'
            });
        }
        // ตรวจสอบว่ามีชื่อซ้ำหรือไม่
        const existingConfig = await lineConfig_1.LineConfig.findOne({ name });
        if (existingConfig) {
            return res.status(400).json({ success: false, message: 'ชื่อการตั้งค่านี้มีอยู่แล้ว' });
        }
        // สร้างการตั้งค่าใหม่
        const lineConfig = await lineConfig_1.LineConfig.create({
            name,
            channelId,
            channelSecret,
            channelAccessToken
        });
        // ส่งข้อมูลกลับโดยไม่รวมข้อมูลที่ละเอียดอ่อน
        const safeConfig = {
            _id: lineConfig._id,
            name: lineConfig.name,
            channelId: lineConfig.channelId,
            createdAt: lineConfig.createdAt,
            updatedAt: lineConfig.updatedAt
        };
        res.status(201).json({ success: true, data: safeConfig });
    }
    catch (error) {
        console.error('❌ ข้อผิดพลาดในการสร้างการตั้งค่า LINE:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างการตั้งค่า LINE' });
    }
});
// อัปเดตการตั้งค่า LINE
router.put('/:id', async (req, res) => {
    try {
        const { name, channelId, channelSecret, channelAccessToken } = req.body;
        // ตรวจสอบว่ามีการตั้งค่าที่ต้องการอัปเดตหรือไม่
        const lineConfig = await lineConfig_1.LineConfig.findById(req.params.id);
        if (!lineConfig) {
            return res.status(404).json({ success: false, message: 'ไม่พบการตั้งค่า LINE' });
        }
        // ตรวจสอบชื่อซ้ำ (ถ้ามีการเปลี่ยนชื่อ)
        if (name && name !== lineConfig.name) {
            const existingConfig = await lineConfig_1.LineConfig.findOne({ name });
            if (existingConfig) {
                return res.status(400).json({ success: false, message: 'ชื่อการตั้งค่านี้มีอยู่แล้ว' });
            }
        }
        // อัปเดตฟิลด์
        if (name)
            lineConfig.name = name;
        if (channelId)
            lineConfig.channelId = channelId;
        if (channelSecret)
            lineConfig.channelSecret = channelSecret;
        if (channelAccessToken)
            lineConfig.channelAccessToken = channelAccessToken;
        await lineConfig.save();
        // ส่งข้อมูลกลับโดยไม่รวมข้อมูลที่ละเอียดอ่อน
        const safeConfig = {
            _id: lineConfig._id,
            name: lineConfig.name,
            channelId: lineConfig.channelId,
            createdAt: lineConfig.createdAt,
            updatedAt: lineConfig.updatedAt
        };
        res.status(200).json({ success: true, data: safeConfig });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการอัปเดตการตั้งค่า LINE ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า LINE' });
    }
});
// ลบการตั้งค่า LINE
router.delete('/:id', async (req, res) => {
    try {
        const lineConfig = await lineConfig_1.LineConfig.findByIdAndDelete(req.params.id);
        if (!lineConfig) {
            return res.status(404).json({ success: false, message: 'ไม่พบการตั้งค่า LINE' });
        }
        res.status(200).json({ success: true, message: 'ลบการตั้งค่า LINE สำเร็จ' });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการลบการตั้งค่า LINE ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบการตั้งค่า LINE' });
    }
});
exports.lineConfigRoutes = router;
