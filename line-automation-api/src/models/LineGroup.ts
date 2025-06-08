import mongoose, { Document, Schema } from 'mongoose';

export interface ILineGroup extends Document {
  name: string;
  accountId: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LineGroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    accountId: { type: String, required: true },
    memberCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model<ILineGroup>('LineGroup', LineGroupSchema); 