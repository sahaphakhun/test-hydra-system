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
const icons_material_1 = require("@mui/icons-material");
const AccountCard_1 = __importDefault(require("@/components/ui/AccountCard"));
const CreateAccountDialog_1 = __importDefault(require("@/components/ui/CreateAccountDialog"));
const api_1 = __importDefault(require("@/lib/api"));
function HomePage() {
    const [accounts, setAccounts] = (0, react_1.useState)([]);
    const [dialogOpen, setDialogOpen] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)(null);
    const [messageType, setMessageType] = (0, react_1.useState)('success');
    // โหลดข้อมูลบัญชีจาก localStorage เมื่อเริ่มต้น
    (0, react_1.useEffect)(() => {
        const savedAccounts = localStorage.getItem('line-accounts');
        if (savedAccounts) {
            try {
                setAccounts(JSON.parse(savedAccounts));
            }
            catch (error) {
                console.error('Failed to parse saved accounts:', error);
            }
        }
    }, []);
    // บันทึกข้อมูลบัญชีลง localStorage เมื่อมีการเปลี่ยนแปลง
    (0, react_1.useEffect)(() => {
        localStorage.setItem('line-accounts', JSON.stringify(accounts));
    }, [accounts]);
    const handleCreateAccount = (data) => __awaiter(this, void 0, void 0, function* () {
        try {
            // เรียก API สร้างบัญชี
            yield api_1.default.post('/automation/register', data);
            // สร้างบัญชีใหม่ใน state
            const newAccount = {
                id: Date.now().toString(),
                name: data.name,
                phoneNumber: data.phoneNumber,
                password: data.password,
                proxy: data.proxy,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };
            setAccounts(prev => [...prev, newAccount]);
            setMessage('สร้างบัญชีสำเร็จ');
            setMessageType('success');
        }
        catch (error) {
            console.error('Failed to create account:', error);
            setMessage('เกิดข้อผิดพลาดในการสร้างบัญชี');
            setMessageType('error');
        }
    });
    const handleEditAccount = (account) => {
        // TODO: เปิด dialog แก้ไข
        console.log('Edit account:', account);
    };
    const handleDeleteAccount = (accountId) => {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        setMessage('ลบบัญชีสำเร็จ');
        setMessageType('success');
    };
    return (<material_1.Container maxWidth="lg" sx={{ py: 4 }}>
      <material_1.Box mb={4}>
        <material_1.Typography variant="h4" component="h1" gutterBottom>
          จัดการบัญชี LINE
        </material_1.Typography>
        <material_1.Typography variant="body1" color="text.secondary">
          สร้างและจัดการบัญชี LINE สำหรับระบบ Automation
        </material_1.Typography>
      </material_1.Box>

      {accounts.length === 0 ? (<material_1.Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px" textAlign="center">
          <material_1.Typography variant="h6" color="text.secondary" mb={2}>
            ยังไม่มีบัญชี LINE
          </material_1.Typography>
          <material_1.Typography variant="body2" color="text.secondary" mb={3}>
            เริ่มต้นด้วยการสร้างบัญชี LINE ใหม่
          </material_1.Typography>
          <material_1.Fab color="primary" onClick={() => setDialogOpen(true)} sx={{ mb: 2 }}>
            <icons_material_1.Add />
          </material_1.Fab>
        </material_1.Box>) : (<material_1.Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3}>
          {accounts.map((account) => (<AccountCard_1.default key={account.id} account={account} onEdit={handleEditAccount} onDelete={handleDeleteAccount}/>))}
        </material_1.Box>)}

      {/* Floating Action Button */}
      {accounts.length > 0 && (<material_1.Fab color="primary" onClick={() => setDialogOpen(true)} sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
            }}>
          <icons_material_1.Add />
        </material_1.Fab>)}

      {/* Create Account Dialog */}
      <CreateAccountDialog_1.default open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreateAccount}/>

      {/* Snackbar for messages */}
      <material_1.Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <material_1.Alert severity={messageType} onClose={() => setMessage(null)}>
          {message}
        </material_1.Alert>
      </material_1.Snackbar>
    </material_1.Container>);
}
exports.default = HomePage;
