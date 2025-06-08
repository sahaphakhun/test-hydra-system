import { Request, Response } from 'express';
import { LineAccount } from '../models/LineAccount';
import LineGroup from '../models/LineGroup';
import PhoneNumberList from '../models/PhoneNumberList';
import Job from '../models/Job';
import { broadcastMessage } from '../websocket';

const createJob = async (type: string, accountId: string | undefined, data: any) => {
  const job = new Job({ type, accountId, data });
  await job.save();
  broadcastMessage('STATUS_UPDATE', { jobId: job._id, status: job.status });
  return job;
};

const updateJobStatusInternal = async (job: any, status: string, log?: string) => {
  job.status = status as any;
  if (log) job.logs.push(log);
  await job.save();
  broadcastMessage('STATUS_UPDATE', { jobId: job._id, status });
};

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
    const { accountId, phoneListId } = req.body;
    if (!accountId || !phoneListId) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    const list = await PhoneNumberList.findById(phoneListId);
    if (!list) {
      return res.status(404).json({ message: 'ไม่พบชุดเบอร์โทรศัพท์' });
    }
    const numbers: string[] = list.chunks.flat();
    const job = await createJob('add_friends', accountId, { numbers });
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้เพิ่มเพื่อน
    await updateJobStatusInternal(job, 'completed');
    return res.status(200).json({ message: `เพิ่มเพื่อนสำเร็จ ${numbers.length} รายการ`, addedCount: numbers.length, jobId: job._id });
  } catch (error) {
    console.error('Error in addFriends:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มเพื่อน' });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, accountId } = req.body;
    if (!name || !accountId) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    const account = await LineAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'ไม่พบบัญชีที่ระบุ' });
    }
    const job = await createJob('create_group', accountId, { name });
    const newGroup = new LineGroup({ name, accountId, memberCount: 0 });
    await newGroup.save();
    await updateJobStatusInternal(job, 'completed');
    return res.status(201).json({ message: 'สร้างกลุ่มสำเร็จ', group: newGroup, jobId: job._id });
  } catch (error) {
    console.error('Error in createGroup:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกลุ่ม' });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedGroup = await LineGroup.findByIdAndDelete(id);
    if (!deletedGroup) {
      return res.status(404).json({ message: 'ไม่พบกลุ่มที่ระบุ' });
    }
    return res.status(200).json({ message: 'ลบกลุ่มสำเร็จ' });
  } catch (error) {
    console.error('Error in deleteGroup:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบกลุ่ม' });
  }
};

export const sendMessageToGroup = async (req: Request, res: Response) => {
  try {
    const { accountId, groupId, message } = req.body as {
      accountId?: string;
      groupId?: string;
      message?: string;
    };

    if (!accountId || !groupId || !message) {
      return res.status(400).json({ message: 'กรุณาระบุ accountId, groupId และข้อความ' });
    }

    const account = await LineAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'ไม่พบบัญชีที่ระบุ' });
    }

    const group = await LineGroup.findOne({ _id: groupId, accountId });
    if (!group) {
      return res.status(404).json({ message: 'ไม่พบกลุ่มที่ระบุ' });
    }

    const job = await createJob('send_message', accountId, { groupId, message });
    // ในสถานการณ์จริงจะต้องมีการสั่งงาน Automation Runner ให้ส่งข้อความ
    await updateJobStatusInternal(job, 'completed');
    return res
      .status(200)
      .json({ message: 'ส่งข้อความสำเร็จ', sent: true, jobId: job._id });
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
    console.log('📝 Creating phone number list with data:', req.body);
    
    // chunks should already be grouped by the client
    const { name, inputType, rawData, chunks } = req.body;
    
    if (!name || !inputType || !chunks || !Array.isArray(chunks)) {
      console.log('❌ Validation failed:', { name, inputType, chunks: Array.isArray(chunks) });
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }
    
    const newList = new PhoneNumberList({
      name,
      inputType,
      rawData: rawData || '',
      chunks, // store provided chunks as-is
      userId: 'system', // ใช้ค่าเริ่มต้น
    });
    
    console.log('💾 Saving phone number list:', newList);
    await newList.save();
    console.log('✅ Phone number list saved successfully');
    
    return res.status(201).json({ message: 'สร้างชุดเบอร์โทรศัพท์สำเร็จ', list: newList });
  } catch (error) {
    console.error('❌ Error in createPhoneNumberList:', error);
    return res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการสร้างชุดเบอร์โทรศัพท์',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deletePhoneNumberList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedList = await PhoneNumberList.findByIdAndDelete(id);
    if (!deletedList) {
      return res.status(404).json({ message: 'ไม่พบชุดเบอร์โทรศัพท์' });
    }
    return res.status(200).json({ message: 'ลบชุดเบอร์โทรศัพท์สำเร็จ' });
  } catch (error) {
    console.error('Error in deletePhoneNumberList:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบชุดเบอร์โทรศัพท์' });
  }
};
