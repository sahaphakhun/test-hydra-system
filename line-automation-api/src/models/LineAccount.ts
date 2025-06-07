import mongoose, { Schema, Document } from 'mongoose';
import { LineAccount } from '../types';

// สร้าง interface ที่ extend Document ของ Mongoose
export interface ILineAccount extends Document, Omit<LineAccount, 'id'> {}

// สร้าง Schema สำหรับ LineAccount
const LineAccountSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    password: { type: String, required: true },
    proxy: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  },
  { timestamps: true }
);

// สร้างและส่งออกโมเดล
export default mongoose.model<ILineAccount>('LineAccount', LineAccountSchema); 