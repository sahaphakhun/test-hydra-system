export interface LineAccount {
  id: string;
  phoneNumber: string;
  displayName: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface PhoneNumberList {
  id: string;
  name: string;
  phoneNumbers: string[];
  createdAt: string;
}

export interface LineGroup {
  id: string;
  name: string;
  accountId: string;
  memberCount: number;
  createdAt: string;
}

export interface AutomationStatus {
  status: 'idle' | 'waitingOtp' | 'processing' | 'success' | 'error';
  message: string;
  details?: any;
} 