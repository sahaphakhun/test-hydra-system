import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL!;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const testApiConnection = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('ไม่สามารถเชื่อมต่อกับ API Server ได้:', error);
    throw error;
  }
};

export const registerLineAccount = async (data: {
  phoneNumber: string;
  displayName: string;
  password: string;
  proxy?: string;
}) => {
  try {
    const response = await api.post('/automation/register', data);
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสมัครบัญชี LINE:', error);
    throw error;
  }
};

export const submitOtp = async (otp: string) => {
  try {
    const response = await api.post('/automation/submit-otp', { otp });
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่ง OTP:', error);
    throw error;
  }
};

export const logoutLine = async () => {
  try {
    const response = await api.post('/logout');
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการออกจากระบบ:', error);
    throw error;
  }
};

// ตัวอย่างฟังก์ชันเพิ่มเติมที่จะต้องพัฒนาในอนาคต
export const addFriendsByPhoneNumbers = async (accountId: string, phoneNumbers: string[]) => {
  try {
    const response = await api.post('/automation/add-friends', { accountId, phoneNumbers });
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มเพื่อน:', error);
    throw error;
  }
};

export const createLineGroup = async (accountId: string, groupName: string) => {
  try {
    const response = await api.post('/automation/create-group', { accountId, groupName });
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างกลุ่ม:', error);
    throw error;
  }
};

export const sendMessageToGroup = async (accountId: string, groupId: string, message: string) => {
  try {
    const response = await api.post('/automation/send-message', { accountId, groupId, message });
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่งข้อความ:', error);
    throw error;
  }
}; 