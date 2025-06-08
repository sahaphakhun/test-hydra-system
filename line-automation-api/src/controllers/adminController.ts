import { Request, Response } from 'express';
import RegistrationRequest from '../models/RegistrationRequest';
import { LineAccount } from '../models/LineAccount';
import Job from '../models/Job';
import { broadcastMessage } from '../websocket';

export const getAllRegistrationRequests = async (req: Request, res: Response) => {
  try {
    const requests = await RegistrationRequest.find().sort({ requestedAt: -1 });
    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
  }
};

export const getRegistrationRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestEntry = await RegistrationRequest.findById(id);
    if (!requestEntry) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
    }
    return res.status(200).json(requestEntry);
  } catch (error) {
    console.error('Error fetching registration request:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลงทะเบียน' });
  }
};

export const updateRegistrationRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const requestEntry = await RegistrationRequest.findById(id);
    if (!requestEntry) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
    }
    
    // ถ้าเปลี่ยนสถานะเป็น completed ให้สร้างบัญชีและลบ request
    if (status === 'completed') {
      // ตรวจสอบว่ามีบัญชีอยู่แล้วหรือไม่
      const existingAccount = await LineAccount.findOne({ phoneNumber: requestEntry.phoneNumber });
      if (existingAccount) {
        return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
      }
      
      // สร้างบัญชีใหม่ใน LineAccount
      const newAccount = new LineAccount({
        displayName: requestEntry.displayName,
        userId: `user_${requestEntry.phoneNumber}_${Date.now()}`, // สร้าง userId ชั่วคราว
        phoneNumber: requestEntry.phoneNumber,
        email: `${requestEntry.phoneNumber}@temp.com`, // email ชั่วคราว
        lineConfigId: '000000000000000000000000', // ObjectId ชั่วคราว
      });
      await newAccount.save();
      
      // ลบ RegistrationRequest
      await RegistrationRequest.findByIdAndDelete(id);
      
      broadcastMessage('STATUS_UPDATE', {
        message: `Account created and registration request removed for ${requestEntry.phoneNumber}`,
        requestId: requestEntry._id,
        phoneNumber: requestEntry.phoneNumber,
        status: 'completed',
        accountCreated: true,
      });
      
      return res.status(200).json({ 
        message: 'สร้างบัญชีสำเร็จและลบคำขอลงทะเบียนแล้ว', 
        account: newAccount 
      });
    }
    
    // สำหรับสถานะอื่น ๆ ให้อัปเดตปกติ
    requestEntry.status = status;
    if (adminNotes) {
      requestEntry.adminNotes = adminNotes;
    }
    await requestEntry.save();
    
    broadcastMessage('STATUS_UPDATE', {
      message: `Registration request ${requestEntry._id} status updated`,
      requestId: requestEntry._id,
      phoneNumber: requestEntry.phoneNumber,
      status: requestEntry.status,
    });
    
    return res.status(200).json({ message: 'อัปเดตสถานะสำเร็จ', request: requestEntry });
  } catch (error) {
    console.error('Error updating registration request status:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
  }
};

export const createAccountFromRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actualDisplayName, actualPassword } = req.body;
    const requestEntry = await RegistrationRequest.findById(id);
    if (!requestEntry) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
    }
    const existingAccount = await LineAccount.findOne({ phoneNumber: requestEntry.phoneNumber });
    if (existingAccount) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
    }
    
    // สร้างบัญชีใหม่ใน LineAccount
    const newAccount = new LineAccount({
      displayName: actualDisplayName || requestEntry.displayName,
      userId: `user_${requestEntry.phoneNumber}_${Date.now()}`, // สร้าง userId ชั่วคราว
      phoneNumber: requestEntry.phoneNumber,
      email: `${requestEntry.phoneNumber}@temp.com`, // email ชั่วคราว
      lineConfigId: '000000000000000000000000', // ObjectId ชั่วคราว
    });
    await newAccount.save();
    
    // ลบ RegistrationRequest หลังจากสร้างบัญชีเสร็จแล้ว
    await RegistrationRequest.findByIdAndDelete(id);
    
    broadcastMessage('STATUS_UPDATE', {
      message: `Account created and registration request removed for ${requestEntry.phoneNumber}`,
      requestId: requestEntry._id,
      phoneNumber: requestEntry.phoneNumber,
      status: 'completed',
      accountCreated: true,
    });
    
    return res.status(201).json({ 
      message: 'สร้างบัญชีสำเร็จและลบคำขอลงทะเบียนแล้ว', 
      account: newAccount 
    });
  } catch (error) {
    console.error('Error creating account from request:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
  }
};

export const deleteRegistrationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestEntry = await RegistrationRequest.findByIdAndDelete(id);
    if (!requestEntry) {
      return res.status(404).json({ message: 'ไม่พบคำขอลงทะเบียน' });
    }
    return res.status(200).json({ message: 'ลบคำขอลงทะเบียนสำเร็จ' });
  } catch (error) {
    console.error('Error deleting registration request:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบคำขอลงทะเบียน' });
  }
};

export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    return res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการงาน' });
  }
};

export const updateJobStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'ไม่พบงาน' });
    }
    job.status = status;
    await job.save();
    broadcastMessage('STATUS_UPDATE', { jobId: job._id, status });
    return res.status(200).json(job);
  } catch (error) {
    console.error('Error updating job status:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะงาน' });
  }
};
