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
exports.MessageTemplate = exports.MessageType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// ประเภทของเทมเพลตข้อความ
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["TEMPLATE"] = "template";
    MessageType["FLEX"] = "flex";
    MessageType["MULTI"] = "multi";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
// สร้างสคีมา
const MessageTemplateSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
        required: [true, 'ต้องระบุเนื้อหาข้อความ'],
    },
    tags: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
// สร้างดัชนี
MessageTemplateSchema.index({ name: 1 });
MessageTemplateSchema.index({ tags: 1 });
// สร้างและส่งออกโมเดล
exports.MessageTemplate = mongoose_1.default.model('MessageTemplate', MessageTemplateSchema);
