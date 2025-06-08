export enum AutomationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AWAITING_OTP = 'awaiting_otp',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface RegisterRequest {
  phoneNumber: string;
  displayName: string;
  password: string;
  proxy?: string;
  autoLogout?: boolean;
}

export interface OtpRequest {
  phoneNumber: string;
  otp: string;
} 