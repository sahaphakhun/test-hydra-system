import express, { Request, Response } from 'express';
import { LineAccount, ILineAccount } from '../models/lineAccount';
import mongoose from 'mongoose';

const router = express.Router();

// รับบัญชี LINE ทั้งหมด
router.get('/', async (req: Request, res: Response) => {
  try {
    const { lineConfigId, tag, limit = 10, page = 1 }: { lineConfigId?: string; tag?: string; limit?: string | number; page?: string | number } = req.query;
    
    // สร้างตัวกรอง
    const filter: any = {};
    
    // กรองตามการตั้งค่า LINE
    if (lineConfigId) {
      filter.lineConfigId = lineConfigId;
    }
    
    // กรองตามแท็ก
    if (tag) {
      filter.tags = tag;
    }
    
    // คำนวณการข้ามข้อมูล
    const skip = (Number(page) - 1) * Number(limit);
    
    // ดึงข้อมูลบัญชี LINE
    const lineAccounts = await LineAccount.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    
    // นับจำนวนบัญชีทั้งหมด
    const total = await LineAccount.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: lineAccounts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการรับบัญชี LINE:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับบัญชี LINE' });
  }
});

// รับบัญชี LINE ตาม ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lineAccount = await LineAccount.findById(req.params.id);
    
    if (!lineAccount) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชี LINE' });
    }
    
    res.status(200).json({ success: true, data: lineAccount });
  } catch (error) {
    console.error(`❌ ข้อผิดพลาดในการรับบัญชี LINE ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรับบัญชี LINE' });
  }
});

// สร้างบัญชี LINE ใหม่
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      displayName, 
      userId, 
      pictureUrl, 
      statusMessage,
      email,
      phoneNumber,
      tags,
      metadata,
      lineConfigId 
    } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!displayName || !userId || !lineConfigId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ต้องระบุชื่อที่แสดง, User ID และการตั้งค่า LINE' 
      });
    }
    
    // ตรวจสอบว่ามีบัญชีนี้อยู่แล้วหรือไม่
    const existingAccount = await LineAccount.findOne({ 
      userId, 
      lineConfigId 
    });
    
    if (existingAccount) {
      return res.status(400).json({ 
        success: false, 
        message: 'บัญชี LINE นี้มีอยู่แล้วสำหรับการตั้งค่านี้' 
      });
    }
    
    // สร้างบัญชีใหม่
    const lineAccount = await LineAccount.create({
      displayName,
      userId,
      pictureUrl,
      statusMessage,
      email,
      phoneNumber,
      tags: tags || [],
      metadata: metadata || {},
      lineConfigId: new mongoose.Types.ObjectId(lineConfigId as string),
      lastInteraction: new Date()
    });
    
    res.status(201).json({ success: true, data: lineAccount });
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการสร้างบัญชี LINE:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างบัญชี LINE' });
  }
});

// อัปเดตบัญชี LINE
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { 
      displayName, 
      pictureUrl, 
      statusMessage,
      email,
      phoneNumber,
      tags,
      metadata,
      isBlocked
    } = req.body;
    
    // ตรวจสอบว่ามีบัญชีที่ต้องการอัปเดตหรือไม่
    const lineAccount = await LineAccount.findById(req.params.id);
    
    if (!lineAccount) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชี LINE' });
    }
    
    // อัปเดตฟิลด์
    if (displayName) lineAccount.displayName = displayName;
    if (pictureUrl !== undefined) lineAccount.pictureUrl = pictureUrl;
    if (statusMessage !== undefined) lineAccount.statusMessage = statusMessage;
    if (email !== undefined) lineAccount.email = email;
    if (phoneNumber !== undefined) lineAccount.phoneNumber = phoneNumber;
    if (tags) lineAccount.tags = tags;
    if (metadata) lineAccount.metadata = metadata;
    if (isBlocked !== undefined) lineAccount.isBlocked = isBlocked;
    
    await lineAccount.save();
    
    res.status(200).json({ success: true, data: lineAccount });
  } catch (error) {
    console.error(`❌ ข้อผิดพลาดในการอัปเดตบัญชี LINE ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตบัญชี LINE' });
  }
});

// ลบบัญชี LINE
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const lineAccount = await LineAccount.findByIdAndDelete(req.params.id);
    
    if (!lineAccount) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชี LINE' });
    }
    
    res.status(200).json({ success: true, message: 'ลบบัญชี LINE สำเร็จ' });
  } catch (error) {
    console.error(`❌ ข้อผิดพลาดในการลบบัญชี LINE ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบบัญชี LINE' });
  }
});

// เพิ่มแท็กให้บัญชี LINE
router.post('/:id/tags', async (req: Request, res: Response) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: 'ต้องระบุแท็กเป็นอาร์เรย์' });
    }
    
    const lineAccount = await LineAccount.findById(req.params.id);
    
    if (!lineAccount) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชี LINE' });
    }
    
    // เพิ่มแท็กที่ไม่ซ้ำ
    const uniqueTags = [...new Set([...lineAccount.tags, ...tags])];
    lineAccount.tags = uniqueTags;
    
    await lineAccount.save();
    
    res.status(200).json({ success: true, data: lineAccount });
  } catch (error) {
    console.error(`❌ ข้อผิดพลาดในการเพิ่มแท็กให้บัญชี LINE ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มแท็กให้บัญชี LINE' });
  }
});

// ลบแท็กจากบัญชี LINE
router.delete('/:id/tags', async (req: Request, res: Response) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: 'ต้องระบุแท็กเป็นอาร์เรย์' });
    }
    
    const lineAccount = await LineAccount.findById(req.params.id);
    
    if (!lineAccount) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชี LINE' });
    }
    
    // ลบแท็กที่ระบุ
    lineAccount.tags = lineAccount.tags.filter(tag => !tags.includes(tag));
    
    await lineAccount.save();
    
    res.status(200).json({ success: true, data: lineAccount });
  } catch (error) {
    console.error(`❌ ข้อผิดพลาดในการลบแท็กจากบัญชี LINE ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบแท็กจากบัญชี LINE' });
  }
});

export const lineAccountRoutes = router; 