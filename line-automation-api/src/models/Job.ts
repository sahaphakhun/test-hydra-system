import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  type: string;
  accountId?: string;
  data: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  logs: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    accountId: { type: String },
    data: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    logs: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>('Job', JobSchema);
