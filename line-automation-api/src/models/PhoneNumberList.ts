import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoneNumberList extends Document {
  name: string;
  inputType: 'manual' | 'text' | 'vcf';
  rawData?: string;
  chunks: string[][];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const PhoneNumberListSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    inputType: {
      type: String,
      enum: ['manual', 'text', 'vcf'],
      required: true,
    },
    rawData: { type: String },
    chunks: { type: [[String]], required: true },
    userId: { type: String, default: 'system' },
  },
  { timestamps: true }
);

export default mongoose.model<IPhoneNumberList>('PhoneNumberList', PhoneNumberListSchema); 