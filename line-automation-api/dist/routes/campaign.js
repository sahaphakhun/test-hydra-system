"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignRoutes = void 0;
const express_1 = __importDefault(require("express"));
const campaign_1 = require("../models/campaign");
const LineAccount_1 = require("../models/LineAccount");
const messageTemplate_1 = require("../models/messageTemplate");
const lineConfig_1 = require("../models/lineConfig");
const mongoose_1 = __importDefault(require("mongoose"));
const websocket_1 = require("../websocket");
const router = express_1.default.Router();
// รับแคมเปญทั้งหมด
router.get('/', async (req, res) => {
    try {
        const { status, lineConfigId, limit = 10, page = 1 } = req.query;
        // สร้างตัวกรอง
        const filter = {};
        // กรองตามสถานะ
        if (status) {
            filter.status = status;
        }
        // กรองตามการตั้งค่า LINE
        if (lineConfigId) {
            filter.lineConfigId = lineConfigId;
        }
        // คำนวณการข้ามข้อมูล
        const skip = (Number(page) - 1) * Number(limit);
        // ดึงข้อมูลแคมเปญ
        const campaigns = await campaign_1.Campaign.find(filter)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 })
            .populate('messageTemplateId', 'name type')
            .populate('lineConfigId', 'name');
        // นับจำนวนแคมเปญทั้งหมด
        const total = await campaign_1.Campaign.countDocuments(filter);
        res.status(200).json({
            success: true,
            data: campaigns,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('❌ ข้อผิดพลาดในการรับแคมเปญ:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับแคมเปญ' });
    }
});
// รับแคมเปญตาม ID
router.get('/:id', async (req, res) => {
    try {
        const campaign = await campaign_1.Campaign.findById(req.params.id)
            .populate('messageTemplateId')
            .populate('lineConfigId', 'name channelId');
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
        }
        res.status(200).json({ success: true, data: campaign });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการรับแคมเปญ ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับแคมเปญ' });
    }
});
// สร้างแคมเปญใหม่
router.post('/', async (req, res) => {
    try {
        const { name, description, messageTemplateId, lineConfigId, targetAudience, scheduledAt } = req.body;
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!name || !messageTemplateId || !lineConfigId) {
            return res.status(400).json({
                success: false,
                message: 'ต้องระบุชื่อ, เทมเพลตข้อความและการตั้งค่า LINE'
            });
        }
        // ตรวจสอบว่าเทมเพลตข้อความมีอยู่จริงหรือไม่
        const messageTemplate = await messageTemplate_1.MessageTemplate.findById(messageTemplateId);
        if (!messageTemplate) {
            return res.status(400).json({ success: false, message: 'ไม่พบเทมเพลตข้อความ' });
        }
        // ตรวจสอบว่าการตั้งค่า LINE มีอยู่จริงหรือไม่
        const lineConfig = await lineConfig_1.LineConfig.findById(lineConfigId);
        if (!lineConfig) {
            return res.status(400).json({ success: false, message: 'ไม่พบการตั้งค่า LINE' });
        }
        // สร้างแคมเปญใหม่
        const campaign = await campaign_1.Campaign.create({
            name,
            description,
            messageTemplateId: new mongoose_1.default.Types.ObjectId(messageTemplateId),
            lineConfigId: new mongoose_1.default.Types.ObjectId(lineConfigId),
            targetAudience: targetAudience || { tags: [] },
            status: scheduledAt ? campaign_1.CampaignStatus.SCHEDULED : campaign_1.CampaignStatus.DRAFT,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        });
        // แจ้งเตือนผ่าน WebSocket ว่ามีการสร้างแคมเปญใหม่
        (0, websocket_1.broadcastMessage)('NOTIFICATION', {
            message: `แคมเปญใหม่ "${campaign.name}" ถูกสร้างขึ้น`,
            campaignId: campaign._id
        });
        res.status(201).json({ success: true, data: campaign });
    }
    catch (error) {
        console.error('❌ ข้อผิดพลาดในการสร้างแคมเปญ:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างแคมเปญ' });
    }
});
// อัปเดตแคมเปญ
router.put('/:id', async (req, res) => {
    try {
        const { name, description, messageTemplateId, targetAudience, status, scheduledAt } = req.body;
        // ตรวจสอบว่ามีแคมเปญที่ต้องการอัปเดตหรือไม่
        const campaign = await campaign_1.Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
        }
        // ตรวจสอบว่าสามารถอัปเดตได้หรือไม่
        if (campaign.status === campaign_1.CampaignStatus.RUNNING) {
            return res.status(400).json({
                success: false,
                message: 'ไม่สามารถอัปเดตแคมเปญที่กำลังดำเนินการได้'
            });
        }
        // ตรวจสอบสถานะ
        if (status && !Object.values(campaign_1.CampaignStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'สถานะไม่ถูกต้อง'
            });
        }
        // ตรวจสอบเทมเพลตข้อความ
        if (messageTemplateId) {
            const messageTemplate = await messageTemplate_1.MessageTemplate.findById(messageTemplateId);
            if (!messageTemplate) {
                return res.status(400).json({ success: false, message: 'ไม่พบเทมเพลตข้อความ' });
            }
        }
        // อัปเดตฟิลด์
        if (name)
            campaign.name = name;
        if (description !== undefined)
            campaign.description = description;
        if (messageTemplateId)
            campaign.messageTemplateId = new mongoose_1.default.Types.ObjectId(messageTemplateId);
        if (targetAudience)
            campaign.targetAudience = targetAudience;
        if (status)
            campaign.status = status;
        if (scheduledAt !== undefined) {
            campaign.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
            // อัปเดตสถานะตามเวลาที่กำหนด
            if (scheduledAt && campaign.status === campaign_1.CampaignStatus.DRAFT) {
                campaign.status = campaign_1.CampaignStatus.SCHEDULED;
            }
            else if (!scheduledAt && campaign.status === campaign_1.CampaignStatus.SCHEDULED) {
                campaign.status = campaign_1.CampaignStatus.DRAFT;
            }
        }
        await campaign.save();
        // แจ้งเตือนผ่าน WebSocket ว่ามีการอัปเดตแคมเปญ
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', {
            message: `แคมเปญ "${campaign.name}" ถูกอัปเดต`,
            campaignId: campaign._id,
            status: campaign.status
        });
        res.status(200).json({ success: true, data: campaign });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการอัปเดตแคมเปญ ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตแคมเปญ' });
    }
});
// ลบแคมเปญ
router.delete('/:id', async (req, res) => {
    try {
        const campaign = await campaign_1.Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
        }
        // ตรวจสอบว่าสามารถลบได้หรือไม่
        if (campaign.status === campaign_1.CampaignStatus.RUNNING) {
            return res.status(400).json({
                success: false,
                message: 'ไม่สามารถลบแคมเปญที่กำลังดำเนินการได้'
            });
        }
        await campaign_1.Campaign.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'ลบแคมเปญสำเร็จ' });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการลบแคมเปญ ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบแคมเปญ' });
    }
});
// เริ่มดำเนินการแคมเปญ
router.post('/:id/start', async (req, res) => {
    try {
        const campaign = await campaign_1.Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
        }
        // ตรวจสอบว่าสามารถเริ่มได้หรือไม่
        if (campaign.status !== campaign_1.CampaignStatus.DRAFT && campaign.status !== campaign_1.CampaignStatus.SCHEDULED) {
            return res.status(400).json({
                success: false,
                message: `ไม่สามารถเริ่มแคมเปญที่มีสถานะ ${campaign.status} ได้`
            });
        }
        // ค้นหากลุ่มเป้าหมาย
        const filter = {
            lineConfigId: campaign.lineConfigId
        };
        // กรองตามแท็ก
        if (campaign.targetAudience.tags && campaign.targetAudience.tags.length > 0) {
            filter.tags = { $in: campaign.targetAudience.tags };
        }
        // กรองตามตัวกรองที่กำหนดเอง
        if (campaign.targetAudience.customFilter && Object.keys(campaign.targetAudience.customFilter).length > 0) {
            Object.assign(filter, campaign.targetAudience.customFilter);
        }
        // นับจำนวนบัญชีเป้าหมาย
        const targetCount = await LineAccount_1.LineAccount.countDocuments(filter);
        // อัปเดตสถานะและสถิติ
        campaign.status = campaign_1.CampaignStatus.RUNNING;
        campaign.stats.totalTargeted = targetCount;
        await campaign.save();
        // แจ้งเตือนผ่าน WebSocket ว่ามีการเริ่มแคมเปญ
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', {
            message: `แคมเปญ "${campaign.name}" เริ่มดำเนินการแล้ว`,
            campaignId: campaign._id,
            status: campaign.status,
            targetCount
        });
        // ในระบบจริง คุณควรเริ่มกระบวนการส่งข้อความที่นี่
        // เช่น ส่งงานไปยังคิวหรือเริ่มกระบวนการที่แยกจากกัน
        res.status(200).json({
            success: true,
            message: 'เริ่มดำเนินการแคมเปญแล้ว',
            data: {
                campaignId: campaign._id,
                targetCount
            }
        });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการเริ่มแคมเปญ ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเริ่มแคมเปญ' });
    }
});
// ยกเลิกแคมเปญ
router.post('/:id/cancel', async (req, res) => {
    try {
        const campaign = await campaign_1.Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'ไม่พบแคมเปญ' });
        }
        // ตรวจสอบว่าสามารถยกเลิกได้หรือไม่
        if (campaign.status !== campaign_1.CampaignStatus.SCHEDULED && campaign.status !== campaign_1.CampaignStatus.RUNNING) {
            return res.status(400).json({
                success: false,
                message: `ไม่สามารถยกเลิกแคมเปญที่มีสถานะ ${campaign.status} ได้`
            });
        }
        // อัปเดตสถานะ
        campaign.status = campaign_1.CampaignStatus.CANCELLED;
        await campaign.save();
        // แจ้งเตือนผ่าน WebSocket ว่ามีการยกเลิกแคมเปญ
        (0, websocket_1.broadcastMessage)('STATUS_UPDATE', {
            message: `แคมเปญ "${campaign.name}" ถูกยกเลิกแล้ว`,
            campaignId: campaign._id,
            status: campaign.status
        });
        res.status(200).json({
            success: true,
            message: 'ยกเลิกแคมเปญสำเร็จ',
            data: { campaignId: campaign._id }
        });
    }
    catch (error) {
        console.error(`❌ ข้อผิดพลาดในการยกเลิกแคมเปญ ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิกแคมเปญ' });
    }
});
exports.campaignRoutes = router;
