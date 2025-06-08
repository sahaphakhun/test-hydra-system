import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoneNumberList extends Document {
  name: string;
  phoneNumbers: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const PhoneNumberListSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumbers: { type: [String], required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPhoneNumberList>('PhoneNumberList', PhoneNumberListSchema); 