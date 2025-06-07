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
function AddFriendsPage() {
    const [userIds, setUserIds] = (0, react_1.useState)(''); // comma separated
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)(false);
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        const ids = userIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
        if (!ids.length)
            return;
        setLoading(true);
        try {
            yield api_1.default.post('/add-friends', { ids });
            setMessage('เพิ่มเพื่อนสำเร็จ');
            setUserIds('');
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
        เพิ่มเพื่อน
      </material_1.Typography>
      <material_1.Stack spacing={2}>
        <material_1.TextField label="User IDs (คั่นด้วย ,)" value={userIds} onChange={(e) => setUserIds(e.target.value)} multiline/>
        <material_1.Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังเพิ่ม…' : 'เพิ่มเพื่อน'}
        </material_1.Button>
      </material_1.Stack>
      <material_1.Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <material_1.Alert severity={message === 'เพิ่มเพื่อนสำเร็จ' ? 'success' : 'error'}>{message}</material_1.Alert>
      </material_1.Snackbar>
    </material_1.Container>);
}
exports.default = AddFriendsPage;
