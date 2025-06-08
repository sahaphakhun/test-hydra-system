import { Request, Response } from 'express';
import RegistrationRequest from '../models/RegistrationRequest';
import LineAccount from '../models/LineAccount';

// ดูคำขอลงทะเบียนทั้งหมด
export const getAllRegistrationRequests = async (req: Request, res: Response) => {
  try {
    const requests = await RegistrationRequest.find()
      .sort({ requestedAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
  }
};

// ดูคำขอลงทะเบียนตาม ID
export const getRegistrationRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await RegistrationRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
    }
    
    res.status(200).json(request);
  } catch (error) {
    console.error('Error fetching registration request:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
  }
};

// อัปเดตสถานะคำขอลงทะเบียน
export const updateRegistrationRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    const request = await RegistrationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
    }
    
    request.status = status;
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }
    
    if (status === 'completed') {
      request.completedAt = new Date();
    }
    
    await request.save();
    
    res.status(200).json({ message: 'อัปเดตสถานะสำเร็จ', request });
  } catch (error) {
    console.error('Error updating registration request status:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
  }
};

// สร้างบัญชี LINE จากคำขอลงทะเบียน
export const createAccountFromRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actualDisplayName, actualPassword } = req.body;
    
    const request = await RegistrationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
    }
    
    // ตรวจสอบว่าเบอร์โทรศัพท์นี้มีในระบบแล้วหรือยัง
    const existingAccount = await LineAccount.findOne({ phoneNumber: request.phoneNumber });
    if (existingAccount) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
    }
    
    // สร้างบัญชีใหม่
    const newAccount = new LineAccount({
      phoneNumber: request.phoneNumber,
      displayName: actualDisplayName || request.displayName,
      password: actualPassword || request.password,
      proxy: request.proxy,
      status: 'active',
    });
    
    await newAccount.save();
    
    // อัปเดตสถานะคำขอเป็น completed
    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();
    
    res.status(201).json({
      message: 'สร้างบัญชีสำเร็จ',
      account: newAccount,
      request: request
    });
  } catch (error) {
    console.error('Error creating account from request:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
  }
};

// ลบคำขอลงทะเบียน
export const deleteRegistrationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const request = await RegistrationRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
    }
    
    res.status(200).json({ message: 'ลบคำขอลงทะเบียนสำเร็จ' });
  } catch (error) {
    console.error('Error deleting registration request:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบคำขอลงทะเบียน' });
  }
}; 