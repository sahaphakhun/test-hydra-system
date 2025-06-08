import mongoose, { Document, Schema } from 'mongoose';

// ประเภทของเทมเพลตข้อความ
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  TEMPLATE = 'template',
  FLEX = 'flex',
  MULTI = 'multi',
}

// อินเตอร์เฟซสำหรับเอกสาร MessageTemplate
export interface IMessageTemplate extends Document {
  name: string;
  description?: string;
  type: MessageType;
  content: any; // เนื้อหาข้อความขึ้นอยู่กับประเภท
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// สร้างสคีมา
const MessageTemplateSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'ต้องระบุชื่อเทมเพลต'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: [true, 'ต้องระบุประเภทข้อความ'],
    },
    content: {
      type: Schema.Types.Mixed,
      required: [true, 'ต้องระบุเนื้อหาข้อความ'],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// สร้างดัชนี
MessageTemplateSchema.index({ name: 1 });
MessageTemplateSchema.index({ tags: 1 });

// สร้างและส่งออกโมเดล
export const MessageTemplate = mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema); 