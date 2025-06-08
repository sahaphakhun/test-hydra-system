// ประเภทของสถานะการทำงานของระบบ Automation
export enum AutomationStatus {
  IDLE = 'idle',
  AWAITING_OTP = 'awaitingOtp',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

// ประเภทข้อมูลบัญชี LINE
export interface LineAccount {
  id: string;
  phoneNumber: string;
  displayName: string;
  password: string;
  proxy?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// ประเภทข้อมูลรายการเบอร์โทรศัพท์
export interface PhoneNumberList {
  id: string;
  name: string;
  phoneNumbers: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ประเภทข้อมูลกลุ่ม LINE
export interface LineGroup {
  id: string;
  name: string;
  accountId: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ประเภทข้อมูลการแจ้งเตือนสถานะ
export interface StatusNotification {
  type: string;
  status: AutomationStatus;
  message: string;
  phoneNumber?: string;
  details?: any;
}

// ประเภทข้อมูลคำขอลงทะเบียนบัญชี LINE
export interface RegisterRequest {
  phoneNumber: string;
  displayName: string;
  password: string;
  proxy?: string;
}

// ประเภทข้อมูลคำขอส่ง OTP
export interface OtpRequest {
  phoneNumber: string;
  otp: string;
}

// ประเภทข้อมูลคำขอเพิ่มเพื่อน
export interface AddFriendsRequest {
  accountId: string;
  phoneNumbers: string[];
}

// ประเภทข้อมูลคำขอสร้างกลุ่ม
export interface CreateGroupRequest {
  accountId: string;
  groupName: string;
}

// ประเภทข้อมูลคำขอส่งข้อความ
export interface SendMessageRequest {
  accountId: string;
  groupId: string;
  message: string;
} 