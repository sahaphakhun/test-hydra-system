import mongoose, { Document, Schema } from 'mongoose';

// อินเตอร์เฟซสำหรับเอกสาร LineConfig
export interface ILineConfig extends Document {
  name: string;
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
  createdAt: Date;
  updatedAt: Date;
}

// สร้างสคีมา
const LineConfigSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'ต้องระบุชื่อการตั้งค่า'],
      trim: true,
      unique: true,
    },
    channelId: {
      type: String,
      required: [true, 'ต้องระบุ Channel ID'],
      trim: true,
    },
    channelSecret: {
      type: String,
      required: [true, 'ต้องระบุ Channel Secret'],
      trim: true,
    },
    channelAccessToken: {
      type: String,
      required: [true, 'ต้องระบุ Channel Access Token'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// สร้างและส่งออกโมเดล
export const LineConfig = mongoose.model<ILineConfig>('LineConfig', LineConfigSchema); 