"use strict";
'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const material_1 = require("@mui/material");
const api_1 = __importDefault(require("@/lib/api"));
function CreateGroupPage() {
    const [groupName, setGroupName] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)(false);
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        if (!groupName.trim())
            return;
        setLoading(true);
        try {
            yield api_1.default.post('/create-group', { name: groupName });
            setMessage('สร้างกลุ่มสำเร็จ');
            setGroupName('');
        }
        catch (_a) {
            setMessage('เกิดข้อผิดพลาด');
        }
        finally {
            setLoading(false);
        }
    });
    return (<material_1.Container maxWidth="sm" sx={{ py: 4 }}>
      <material_1.Typography variant="h4" gutterBottom>
        สร้างกลุ่ม LINE
      </material_1.Typography>
      <material_1.Stack spacing={2}>
        <material_1.TextField label="ชื่อกลุ่ม" value={groupName} onChange={(e) => setGroupName(e.target.value)}/>
        <material_1.Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังสร้าง…' : 'สร้างกลุ่ม'}
        </material_1.Button>
      </material_1.Stack>
      <material_1.Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <material_1.Alert severity={message === 'สร้างกลุ่มสำเร็จ' ? 'success' : 'error'}>{message}</material_1.Alert>
      </material_1.Snackbar>
    </material_1.Container>);
}
exports.default = CreateGroupPage;
