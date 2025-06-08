import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistrationRequest extends Document {
  phoneNumber: string;
  displayName: string;
  password: string;
  proxy?: string;
  autoLogout: boolean;
  status: 'pending' | 'processing' | 'awaiting_otp' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  otpRequested: boolean;
  otpRequestedAt?: Date;
  adminNotes?: string;
}

const RegistrationRequestSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true },
    displayName: { type: String, required: true },
    password: { type: String, required: true },
    proxy: { type: String },
    autoLogout: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'awaiting_otp', 'completed', 'failed'],
      default: 'pending',
    },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    otpRequested: { type: Boolean, default: false },
    otpRequestedAt: { type: Date },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IRegistrationRequest>('RegistrationRequest', RegistrationRequestSchema); 