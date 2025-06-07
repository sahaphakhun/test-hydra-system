export interface Account {
  id: string;
  name: string;
  phoneNumber: string;
  password: string;
  proxy?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastActive?: string;
}

export interface CreateAccountData {
  name: string;
  phoneNumber: string;
  password: string;
  proxy?: string;
} 