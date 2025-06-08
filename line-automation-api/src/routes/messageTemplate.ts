import express, { Request, Response } from 'express';
import { MessageTemplate, IMessageTemplate, MessageType } from '../models/messageTemplate';

const router = express.Router();

// รับเทมเพลตข้อความทั้งหมด
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, tag, limit = 10, page = 1 } = req.query;
    
    // สร้างตัวกรอง
    const filter: any = {};
    
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
    const messageTemplates = await MessageTemplate.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    
    // นับจำนวนเทมเพลตทั้งหมด
    const total = await MessageTemplate.countDocuments(filter);
    
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
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการรับเทมเพลตข้อความ:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับเทมเพลตข้อความ' });
  }
});

// รับเทมเพลตข้อความตาม ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const messageTemplate = await MessageTemplate.findById(req.params.id);
    
    if (!messageTemplate) {
      return res.status(404).json({ success: false, message: 'ไม่พบเทมเพลตข้อความ' });
    }
    
    res.status(200).json({ success: true, data: messageTemplate });
  } catch (error) {
    console.error(`❌ ข้อผิดพลาดในการรับเทมเพลตข้อความ ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับเทมเพลตข้อความ' });
  }
});

// สร้างเทมเพลตข้อความใหม่
router.post('/', async (req: Request, res: Response) => {
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
    if (!Object.values(MessageType).includes(type as MessageType)) {
      return res.status(400).json({
        success: false,
        message: 'ประเภทข้อความไม่ถูกต้อง'
      });
    }
    
    // ตรวจสอบว่ามีชื่อซ้ำหรือไม่
    const existingTemplate = await MessageTemplate.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({ success: false, message: 'ชื่อเทมเพลตนี้มีอยู่แล้ว' });
    }
    
    // สร้างเทมเพลตใหม่
    const messageTemplate = await MessageTemplate.create({
      name,
      description,
      type,
      content,
      tags: tags || []
    });
    
    res.status(201).json({ success: true, data: messageTemplate });
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการสร้างเทมเพลตข้อความ:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างเทมเพลตข้อความ' });
  }
});

// อัปเดตเทมเพลตข้อความ
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, type, content, tags } = req.body;
    
    // ตรวจสอบว่ามีเทมเพลตที่ต้องการอัปเดตหรือไม่
    const messageTemplate = await MessageTemplate.findById(req.params.id);
    
    if (!messageTemplate) {
      return res.status(404).json({ success: false, message: 'ไม่พบเทมเพลตข้อความ' });
    }
    
    // ตรวจสอบชื่อซ้ำ (ถ้ามีการเปลี่ยนชื่อ)
    if (name && name !== messageTemplate.name) {
      const existingTemplate = await MessageTemplate.findOne({ name });
      if (existingTemplate) {
        return res.status(400).json({ success: false, message: 'ชื่อเทมเพลตนี้มีอยู่แล้ว' });
      }
    }
    
    // ตรวจสอบประเภทข้อความ
    if (type && !Object.values(MessageType).includes(type as MessageType)) {
      return res.status(400).json({
        success: false,
        message: 'ประเภทข้อความไม่ถูกต้อง'
      });
    }
    
    // อัปเดตฟิลด์
    if (name) messageTemplate.name = name;
    if (description !== undefined) messageTemplate.description = description;
    if (type) messageTemplate.type = type as MessageType;
    if (content) messageTemplate.content = content;
    if (tags) messageTemplate.tags = tags;
    
    await messageTemplate.save();
    
    res.status(200).json({ success: true, data: messageTemplate });
  } catch (error) {
    console.error(`❌ ข้อผิดพลาดในการอัปเดตเทมเพลตข้อความ ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตเทมเพลตข้อความ' });
  }
});

// ลบเทมเพลตข้อความ
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const messageTemplate = await MessageTemplate.findByIdAndDelete(req.params.id);
    
    if (!messageTemplate) {
      return res.status(404).json({ success: false, message: 'ไม่พบเทมเพลตข้อความ' });
    }
    
    res.status(200).json({ success: true, message: 'ลบเทมเพลตข้อความสำเร็จ' });
  } catch (error) {
    console.error(`❌ ข้อผิดพลาดในการลบเทมเพลตข้อความ ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเทมเพลตข้อความ' });
  }
});

export const messageTemplateRoutes = router; 