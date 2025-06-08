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
exports.LineAccount = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// สร้างสคีมา
const LineAccountSchema = new mongoose_1.Schema({
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
        of: mongoose_1.Schema.Types.Mixed,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LineConfig',
        required: [true, 'ต้องระบุการตั้งค่า LINE'],
    },
}, {
    timestamps: true,
});
// สร้างดัชนีผสม
LineAccountSchema.index({ userId: 1, lineConfigId: 1 }, { unique: true });
// สร้างและส่งออกโมเดล
exports.LineAccount = mongoose_1.default.model('LineAccount', LineAccountSchema);
