export interface Account {
  id: string;
  name: string;
  phoneNumber: string;
  password: string;
  proxy?: string;
  status:
  | 'active'
  | 'inactive'
  | 'pending'
  | 'processing'
  | 'awaiting_otp'
  | 'completed'
  | 'failed'
  | 'timeout';  createdAt: string;
  lastActive?: string;
}

export interface CreateAccountData {
  name: string;
  phoneNumber: string;
  password: string;
  proxy?: string;
  autoLogout?: boolean;
} 