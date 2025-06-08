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
function SendMessagePage() {
    const [accounts, setAccounts] = (0, react_1.useState)([]);
    const [groups, setGroups] = (0, react_1.useState)([]);
    const [accountId, setAccountId] = (0, react_1.useState)('');
    const [groupId, setGroupId] = (0, react_1.useState)('');
    const [message, setMessage] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [success, setSuccess] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        api_1.default.get('/accounts')
            .then((res) => setAccounts(res.data))
            .catch(() => setAccounts([]));
    }, []);
    (0, react_1.useEffect)(() => {
        if (!accountId) {
            setGroups([]);
            setGroupId('');
            return;
        }
        api_1.default.get(`/accounts/${accountId}/groups`)
            .then((res) => setGroups(res.data))
            .catch(() => setGroups([]));
    }, [accountId]);
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        if (!message.trim() || !accountId || !groupId)
            return;
        setLoading(true);
        try {
            yield api_1.default.post('/send-message', { accountId, groupId, message });
            setSuccess('ส่งข้อความสำเร็จ');
            setMessage('');
        }
        catch (_a) {
            setSuccess('เกิดข้อผิดพลาด');
        }
        finally {
            setLoading(false);
        }
    });
    return (<material_1.Container maxWidth="sm" sx={{ py: 4 }}>
      <material_1.Typography variant="h4" gutterBottom>
        ส่งข้อความ
      </material_1.Typography>

      <material_1.Stack spacing={2}>
        <material_1.TextField select label="บัญชี LINE" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((acc) => (<material_1.MenuItem key={acc._id} value={acc._id}>
              {acc.displayName || acc.phoneNumber}
            </material_1.MenuItem>))}
        </material_1.TextField>

        <material_1.TextField select label="กลุ่ม" value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={!accountId}>
          {groups.map((group) => (<material_1.MenuItem key={group._id} value={group._id}>
              {group.name}
            </material_1.MenuItem>))}
        </material_1.TextField>

        <material_1.TextField label="ข้อความ" value={message} onChange={(e) => setMessage(e.target.value)} multiline rows={4}/>
        <material_1.Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังส่ง...' : 'ส่งข้อความ'}
        </material_1.Button>
      </material_1.Stack>

      <material_1.Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <material_1.Alert severity={success === 'ส่งข้อความสำเร็จ' ? 'success' : 'error'}>
          {success}
        </material_1.Alert>
      </material_1.Snackbar>
    </material_1.Container>);
}
exports.default = SendMessagePage;
