import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageRequest extends Document {
  accountId: string;
  groupId: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const MessageRequestSchema: Schema = new Schema(
  {
    accountId: { type: String, required: true },
    groupId: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMessageRequest>('MessageRequest', MessageRequestSchema);
