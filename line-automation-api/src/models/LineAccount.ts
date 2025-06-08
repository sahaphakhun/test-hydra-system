import mongoose, { Document, Schema } from 'mongoose';

// อินเตอร์เฟซสำหรับเอกสาร LineAccount
export interface ILineAccount extends Document {
  displayName: string;
  userId: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
  phoneNumber?: string;
  tags: string[];
  metadata: Record<string, any>;
  isBlocked: boolean;
  lastInteraction: Date;
  lineConfigId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// สร้างสคีมา
const LineAccountSchema: Schema = new Schema(
  {
    displayName: {
      type: String,
      required: [true, 'ต้องระบุชื่อที่แสดง'],
      trim: true,
    },
    userId: {
      type: String,
      required: [true, 'ต้องระบุ User ID'],
      trim: true,
      unique: true,
    },
    pictureUrl: {
      type: String,
      trim: true,
    },
    statusMessage: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastInteraction: {
      type: Date,
      default: Date.now,
    },
    lineConfigId: {
      type: Schema.Types.ObjectId,
      ref: 'LineConfig',
      required: [true, 'ต้องระบุการตั้งค่า LINE'],
    },
  },
  {
    timestamps: true,
  }
);

// สร้างดัชนีผสม
LineAccountSchema.index({ userId: 1, lineConfigId: 1 }, { unique: true });

// สร้างและส่งออกโมเดล
export const LineAccount = mongoose.model<ILineAccount>('LineAccount', LineAccountSchema); 