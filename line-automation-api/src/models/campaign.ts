import mongoose, { Document, Schema } from 'mongoose';

// สถานะของแคมเปญ
export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

// อินเตอร์เฟซสำหรับเอกสาร Campaign
export interface ICampaign extends Document {
  name: string;
  description?: string;
  messageTemplateId: mongoose.Types.ObjectId;
  lineConfigId: mongoose.Types.ObjectId;
  targetAudience: {
    tags?: string[];
    customFilter?: Record<string, any>;
  };
  status: CampaignStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  stats: {
    totalTargeted: number;
    totalSent: number;
    totalFailed: number;
    totalDelivered: number;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// สร้างสคีมา
const CampaignSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'ต้องระบุชื่อแคมเปญ'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    messageTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'MessageTemplate',
      required: [true, 'ต้องระบุเทมเพลตข้อความ'],
    },
    lineConfigId: {
      type: Schema.Types.ObjectId,
      ref: 'LineConfig',
      required: [true, 'ต้องระบุการตั้งค่า LINE'],
    },
    targetAudience: {
      tags: {
        type: [String],
        default: [],
      },
      customFilter: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
    },
    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      default: CampaignStatus.DRAFT,
    },
    scheduledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    stats: {
      totalTargeted: {
        type: Number,
        default: 0,
      },
      totalSent: {
        type: Number,
        default: 0,
      },
      totalFailed: {
        type: Number,
        default: 0,
      },
      totalDelivered: {
        type: Number,
        default: 0,
      },
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// สร้างดัชนี
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ scheduledAt: 1 });
CampaignSchema.index({ lineConfigId: 1 });

// สร้างและส่งออกโมเดล
export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema); 