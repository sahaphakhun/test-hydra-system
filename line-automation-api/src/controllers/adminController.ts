import { Request, Response } from 'express';
import RegistrationRequest from '../models/RegistrationRequest';
import { LineAccount } from '../models/lineAccount';

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
    requestEntry.status = status;
    if (adminNotes) {
      requestEntry.adminNotes = adminNotes;
    }
    if (status === 'completed') {
      requestEntry.completedAt = new Date();
    }
    await requestEntry.save();
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
    const newAccount = new LineAccount({
      phoneNumber: requestEntry.phoneNumber,
      displayName: actualDisplayName || requestEntry.displayName,
      password: actualPassword || requestEntry.password,
      proxy: requestEntry.proxy,
      status: 'active',
    });
    await newAccount.save();
    requestEntry.status = 'completed';
    requestEntry.completedAt = new Date();
    await requestEntry.save();
    return res.status(201).json({ message: 'สร้างบัญชีสำเร็จ', account: newAccount, request: requestEntry });
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