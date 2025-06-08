import mongoose, { Document, Schema } from 'mongoose';

export interface ILineAccount extends Document {
  displayName: string;
  userId: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
  phoneNumber?: string;
  tags: string[];
  metadata: Record<string, any>;
  lineConfigId: mongoose.Types.ObjectId;
  isBlocked: boolean;
  lastInteraction: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LineAccountSchema: Schema = new Schema(
  {
    displayName: { type: String, required: true, trim: true },
    userId: { type: String, required: true, trim: true, unique: true },
    pictureUrl: { type: String },
    statusMessage: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    tags: { type: [String], default: [] },
    metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
    lineConfigId: { type: Schema.Types.ObjectId, ref: 'LineConfig', required: true },
    isBlocked: { type: Boolean, default: false },
    lastInteraction: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const LineAccount = mongoose.model<ILineAccount>('LineAccount', LineAccountSchema);
