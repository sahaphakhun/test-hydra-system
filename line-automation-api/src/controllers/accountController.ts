import { Request, Response } from 'express';
import { LineAccount } from '../models/lineAccount';
import LineGroup from '../models/LineGroup';
import PhoneNumberList from '../models/PhoneNumberList';

export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await LineAccount.find().select('-password');
    return res.status(200).json(accounts);
  } catch (error) {
    console.error('Error in getAllAccounts:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการบัญชี' });
  }
};

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

export const addFriends = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้เพิ่มเพื่อน
    return res.status(200).json({ message: `เพิ่มเพื่อนสำเร็จ ${ids.length} รายการ`, addedCount: ids.length });
  } catch (error) {
    console.error('Error in addFriends:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มเพื่อน' });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    const newGroup = new LineGroup({ name, accountId: '', memberCount: 0 });
    await newGroup.save();
    return res.status(201).json({ message: 'สร้างกลุ่มสำเร็จ', group: newGroup });
  } catch (error) {
    console.error('Error in createGroup:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกลุ่ม' });
  }
};

export const sendMessageToGroup = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'กรุณาระบุข้อความ' });
    }
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้ส่งข้อความ
    return res.status(200).json({ message: 'ส่งข้อความสำเร็จ', sent: true });
  } catch (error) {
    console.error('Error in sendMessageToGroup:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
  }
};

export const getPhoneNumberLists = async (req: Request, res: Response) => {
  try {
    const lists = await PhoneNumberList.find();
    return res.status(200).json(lists);
  } catch (error) {
    console.error('Error in getPhoneNumberLists:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการชุดเบอร์โทรศัพท์' });
  }
};

export const createPhoneNumberList = async (req: Request, res: Response) => {
  try {
    const { name, phoneNumbers } = req.body;
    if (!name || !phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    const newList = new PhoneNumberList({ name, phoneNumbers, userId: '' });
    await newList.save();
    return res.status(201).json({ message: 'สร้างชุดเบอร์โทรศัพท์สำเร็จ', list: newList });
  } catch (error) {
    console.error('Error in createPhoneNumberList:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างชุดเบอร์โทรศัพท์' });
  }
}; 