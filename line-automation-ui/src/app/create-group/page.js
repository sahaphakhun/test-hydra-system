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
    const [jobId, setJobId] = (0, react_1.useState)('');
    const [jobStatus, setJobStatus] = (0, react_1.useState)('');
    const [accounts, setAccounts] = (0, react_1.useState)([]);
    const [accountId, setAccountId] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        if (!jobId)
            return;
        const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!rawWsUrl)
            return;
        const ws = new WebSocket(rawWsUrl.replace(/^http/, 'ws'));
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'STATUS_UPDATE' && (data.payload === null || data.payload === void 0 ? void 0 : data.payload.jobId) === jobId) {
                    setJobStatus(data.payload.status);
                }
            }
            catch (_a) { }
        };
        return () => ws.close();
    }, [jobId]);
    (0, react_1.useEffect)(() => {
        const fetchAccounts = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield api_1.default.get('/accounts');
                setAccounts(res.data);
                if (res.data.length > 0)
                    setAccountId(res.data[0]._id);
            }
            catch (err) {
                console.error(err);
            }
        });
        fetchAccounts();
    }, []);
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        if (!groupName.trim() || !accountId)
            return;
        setLoading(true);
        try {
            const res = yield api_1.default.post('/create-group', { name: groupName, accountId });
            setMessage('สร้างกลุ่มสำเร็จ');
            setGroupName('');
            if (res.data.jobId)
                setJobId(res.data.jobId);
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
        <material_1.FormControl fullWidth>
          <material_1.InputLabel id="account-select-label">บัญชี LINE</material_1.InputLabel>
          <material_1.Select labelId="account-select-label" label="บัญชี LINE" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((acc) => (<material_1.MenuItem key={acc._id} value={acc._id}>{acc.displayName || acc.userId}</material_1.MenuItem>))}
          </material_1.Select>
        </material_1.FormControl>
        <material_1.TextField label="ชื่อกลุ่ม" value={groupName} onChange={(e) => setGroupName(e.target.value)}/>
        <material_1.Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังสร้าง…' : 'สร้างกลุ่ม'}
        </material_1.Button>
      </material_1.Stack>
      {jobId && (<material_1.Typography mt={2}>สถานะงาน: {jobStatus || 'pending'}</material_1.Typography>)}
      <material_1.Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <material_1.Alert severity={message === 'สร้างกลุ่มสำเร็จ' ? 'success' : 'error'}>{message}</material_1.Alert>
      </material_1.Snackbar>
    </material_1.Container>);
}
exports.default = CreateGroupPage;
