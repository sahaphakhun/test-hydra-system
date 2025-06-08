"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Campaign = exports.CampaignStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// สถานะของแคมเปญ
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["DRAFT"] = "draft";
    CampaignStatus["SCHEDULED"] = "scheduled";
    CampaignStatus["RUNNING"] = "running";
    CampaignStatus["COMPLETED"] = "completed";
    CampaignStatus["CANCELLED"] = "cancelled";
    CampaignStatus["FAILED"] = "failed";
})(CampaignStatus = exports.CampaignStatus || (exports.CampaignStatus = {}));
// สร้างสคีมา
const CampaignSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MessageTemplate',
        required: [true, 'ต้องระบุเทมเพลตข้อความ'],
    },
    lineConfigId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            of: mongoose_1.Schema.Types.Mixed,
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
        of: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
// สร้างดัชนี
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ scheduledAt: 1 });
CampaignSchema.index({ lineConfigId: 1 });
// สร้างและส่งออกโมเดล
exports.Campaign = mongoose_1.default.model('Campaign', CampaignSchema);
