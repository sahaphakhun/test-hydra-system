import mongoose, { Schema, Document } from 'mongoose';
import { PhoneNumberList } from '../types';

// สร้าง interface ที่ extend Document ของ Mongoose
export interface IPhoneNumberList extends Document, Omit<PhoneNumberList, 'id'> {}

// สร้าง Schema สำหรับ PhoneNumberList
const PhoneNumberListSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumbers: { type: [String], required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

// สร้างและส่งออกโมเดล
export default mongoose.model<IPhoneNumberList>('PhoneNumberList', PhoneNumberListSchema); 