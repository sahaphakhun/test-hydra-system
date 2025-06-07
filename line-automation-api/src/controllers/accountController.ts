import { Request, Response } from 'express';
import LineAccount from '../models/LineAccount';
import LineGroup from '../models/LineGroup';
import PhoneNumberList from '../models/PhoneNumberList';
import { AddFriendsRequest, CreateGroupRequest, SendMessageRequest } from '../types';

// ดึงรายการบัญชี LINE ทั้งหมด
export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await LineAccount.find().select('-password');
    return res.status(200).json(accounts);
  } catch (error) {
    console.error('Error in getAllAccounts:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการบัญชี' });
  }
};

// ดึงรายละเอียดบัญชี LINE
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const accountId = req.params.id;
    const account = await LineAccount.findById(accountId).select('-password');
    
    if (!account) {
      return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
    }
    
    return res.status(200).json(account);
  } catch (error) {
    console.error('Error in getAccountById:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี' });
  }
};

// ดึงรายการกลุ่ม LINE ของบัญชีหนึ่งๆ
export const getGroupsByAccountId = async (req: Request, res: Response) => {
  try {
    const accountId = req.params.accountId;
    const groups = await LineGroup.find({ accountId });
    
    return res.status(200).json(groups);
  } catch (error) {
    console.error('Error in getGroupsByAccountId:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการกลุ่ม' });
  }
};

// เพิ่มเพื่อนจากเบอร์โทรศัพท์
export const addFriends = async (req: Request, res: Response) => {
  try {
    const { accountId, phoneNumbers }: AddFriendsRequest = req.body;
    
    if (!accountId || !phoneNumbers || phoneNumbers.length === 0) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    
    // ตรวจสอบว่าบัญชีที่ระบุมีอยู่จริงหรือไม่
    const account = await LineAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
    }
    
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้เพิ่มเพื่อน
    
    return res.status(200).json({
      message: `เพิ่มเพื่อนสำเร็จ ${phoneNumbers.length} เบอร์`,
      addedCount: phoneNumbers.length,
    });
  } catch (error) {
    console.error('Error in addFriends:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มเพื่อน' });
  }
};

// สร้างกลุ่ม LINE
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { accountId, groupName }: CreateGroupRequest = req.body;
    
    if (!accountId || !groupName) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    
    // ตรวจสอบว่าบัญชีที่ระบุมีอยู่จริงหรือไม่
    const account = await LineAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
    }
    
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้สร้างกลุ่ม
    
    // สร้างกลุ่มใหม่ในฐานข้อมูล
    const newGroup = new LineGroup({
      name: groupName,
      accountId,
      memberCount: 1,
    });
    
    await newGroup.save();
    
    return res.status(201).json({
      message: 'สร้างกลุ่มสำเร็จ',
      group: newGroup,
    });
  } catch (error) {
    console.error('Error in createGroup:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกลุ่ม' });
  }
};

// ส่งข้อความไปยังกลุ่ม LINE
export const sendMessageToGroup = async (req: Request, res: Response) => {
  try {
    const { accountId, groupId, message }: SendMessageRequest = req.body;
    
    if (!accountId || !groupId || !message) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    
    // ตรวจสอบว่าบัญชีที่ระบุมีอยู่จริงหรือไม่
    const account = await LineAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'ไม่พบบัญชีที่ต้องการ' });
    }
    
    // ตรวจสอบว่ากลุ่มที่ระบุมีอยู่จริงหรือไม่
    const group = await LineGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'ไม่พบกลุ่มที่ต้องการ' });
    }
    
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้ส่งข้อความ
    
    return res.status(200).json({
      message: 'ส่งข้อความสำเร็จ',
      sentTo: group.name,
      sentFrom: account.displayName,
    });
  } catch (error) {
    console.error('Error in sendMessageToGroup:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
  }
};

// ดึงและจัดการรายการชุดเบอร์โทรศัพท์
export const getPhoneNumberLists = async (req: Request, res: Response) => {
  try {
    const lists = await PhoneNumberList.find();
    return res.status(200).json(lists);
  } catch (error) {
    console.error('Error in getPhoneNumberLists:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการชุดเบอร์โทรศัพท์' });
  }
};

// สร้างชุดเบอร์โทรศัพท์ใหม่
export const createPhoneNumberList = async (req: Request, res: Response) => {
  try {
    const { name, phoneNumbers, userId } = req.body;
    
    if (!name || !phoneNumbers || !userId) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    
    // สร้างชุดเบอร์โทรศัพท์ใหม่
    const newList = new PhoneNumberList({
      name,
      phoneNumbers,
      userId,
    });
    
    await newList.save();
    
    return res.status(201).json({
      message: 'สร้างชุดเบอร์โทรศัพท์สำเร็จ',
      list: newList,
    });
  } catch (error) {
    console.error('Error in createPhoneNumberList:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างชุดเบอร์โทรศัพท์' });
  }
}; 