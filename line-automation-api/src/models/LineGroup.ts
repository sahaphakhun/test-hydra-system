import mongoose, { Schema, Document } from 'mongoose';
import { LineGroup } from '../types';

// สร้าง interface ที่ extend Document ของ Mongoose
export interface ILineGroup extends LineGroup, Document {}

// สร้าง Schema สำหรับ LineGroup
const LineGroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    accountId: { type: String, required: true },
    memberCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// สร้างและส่งออกโมเดล
export default mongoose.model<ILineGroup>('LineGroup', LineGroupSchema); 