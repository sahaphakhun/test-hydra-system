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
const OtpDialog_1 = __importDefault(require("@/components/ui/OtpDialog"));
function HomePage() {
    const [accounts, setAccounts] = (0, react_1.useState)([]);
    const [dialogOpen, setDialogOpen] = (0, react_1.useState)(false);
    const [otpDialog, setOtpDialog] = (0, react_1.useState)({ phoneNumber: '', open: false });
    const [message, setMessage] = (0, react_1.useState)(null);
    const [messageType, setMessageType] = (0, react_1.useState)('success');
    const [waitingPhoneNumber, setWaitingPhoneNumber] = (0, react_1.useState)(null);
    const [waitStartTime, setWaitStartTime] = (0, react_1.useState)(null);
    const [showManualOtp, setShowManualOtp] = (0, react_1.useState)(false);
    const [showRequestOtp, setShowRequestOtp] = (0, react_1.useState)(false);
    // โหลดข้อมูลบัญชีจาก localStorage เมื่อเริ่มต้น
    (0, react_1.useEffect)(() => {
        const savedAccounts = localStorage.getItem('line-accounts');
        if (savedAccounts) {
            try {
                setAccounts(JSON.parse(savedAccounts));
                // if there is account awaiting otp, open dialog automatically
                const parsed = JSON.parse(savedAccounts);
                const awaiting = parsed.find((acc) => acc.status === 'awaitingOtp');
                if (awaiting) {
                    // อ่าน timestamp จาก localStorage หากมี เพื่อรักษา countdown
                    let startTime;
                    try {
                        const raw = localStorage.getItem('otpWaitingData');
                        if (raw) {
                            const data = JSON.parse(raw);
                            if (data.phoneNumber === awaiting.phoneNumber)
                                startTime = data.startTime;
                        }
                    }
                    catch (_a) { }
                    setOtpDialog({ phoneNumber: awaiting.phoneNumber, open: true, startTime });
                }
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
    // WebSocket เพื่อติดตามสถานะ
    (0, react_1.useEffect)(() => {
        const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!rawWsUrl) {
            console.warn('NEXT_PUBLIC_WS_URL is not defined. ไม่สามารถเชื่อมต่อ WebSocket');
            return;
        }
        const wsUrl = rawWsUrl.replace(/^http/, 'ws');
        const socket = new WebSocket(wsUrl);
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'statusUpdate' && data.phoneNumber) {
                    // บางกรณี backend อาจส่งสถานะในรูปแบบอื่น ๆ เช่น otpWait, otp_wait
                    const rawStatus = data.status;
                    const normalizedStatus = rawStatus === 'processing'
                        ? 'pending'
                        : rawStatus === 'otpWait' || rawStatus === 'otp_wait' || rawStatus === 'waiting_otp'
                            ? 'awaitingOtp'
                            : rawStatus;
                    // อัปเดตสถานะใน state
                    setAccounts(prev => prev.map(acc => acc.phoneNumber === data.phoneNumber ? Object.assign(Object.assign({}, acc), { status: normalizedStatus }) : acc));
                    if (normalizedStatus === 'awaitingOtp') {
                        const now = Date.now();
                        // บันทึก timestamp เพื่อให้ reload คง countdown ต่อเนื่อง
                        try {
                            localStorage.setItem('otpWaitingData', JSON.stringify({ phoneNumber: data.phoneNumber, startTime: now }));
                        }
                        catch (_a) { }
                        setOtpDialog({ phoneNumber: data.phoneNumber, open: true, startTime: now });
                        setWaitingPhoneNumber(null);
                        setWaitStartTime(null);
                        setShowManualOtp(false);
                        setShowRequestOtp(true); // แสดงปุ่มขอ OTP
                    }
                    else if (['success', 'error', 'timeout'].includes(normalizedStatus)) {
                        // ล้างข้อมูล waiting และ otpWaitingData เมื่อจบ
                        setWaitingPhoneNumber(null);
                        setWaitStartTime(null);
                        setShowManualOtp(false);
                        setShowRequestOtp(false);
                        try {
                            localStorage.removeItem('otpWaitingData');
                        }
                        catch (_b) { }
                    }
                    return; // จบ early
                }
            }
            catch (err) {
                console.error('Invalid WS message', err);
            }
        };
        socket.onerror = console.error;
        return () => {
            socket.close();
        };
    }, []);
    const handleCreateAccount = (data) => __awaiter(this, void 0, void 0, function* () {
        try {
            // เรียก API สร้างบัญชี
            yield api_1.default.post('/automation/register', {
                phoneNumber: data.phoneNumber,
                displayName: data.name,
                password: data.password,
                proxy: data.proxy,
                autoLogout: data.autoLogout,
            });
            setWaitingPhoneNumber(data.phoneNumber);
            setWaitStartTime(Date.now());
            setShowManualOtp(false);
            // สร้างบัญชีใหม่ใน state
            const newAccount = {
                id: data.phoneNumber,
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
    // ลองสมัครบัญชีใหม่เมื่อเกิดข้อผิดพลาดหรือหมดเวลารอ
    const handleRetryAccount = (account) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield api_1.default.post('/automation/register', {
                phoneNumber: account.phoneNumber,
                displayName: account.name,
                password: account.password,
                proxy: account.proxy,
            });
            setWaitingPhoneNumber(account.phoneNumber);
            setWaitStartTime(Date.now());
            setShowManualOtp(false);
            setAccounts(prev => prev.map(acc => acc.id === account.id ? Object.assign(Object.assign({}, acc), { status: 'pending' }) : acc));
            setMessage('เริ่มสมัครใหม่แล้ว');
            setMessageType('success');
        }
        catch (error) {
            console.error('Failed to retry registration:', error);
            setMessage('ลองสมัครใหม่ไม่สำเร็จ');
            setMessageType('error');
        }
    });
    /**
     * เปิด dialog เพื่อกรอก OTP สำหรับเบอร์โทรศัพท์ที่ระบุ
     */
    const handleOpenOtp = (account) => {
        const now = Date.now();
        setOtpDialog({ phoneNumber: account.phoneNumber, open: true, startTime: now });
        // ยกเลิกการแสดง Backdrop ระหว่างกรอก OTP
        setWaitingPhoneNumber(null);
        // เก็บ timestamp เพื่อให้รีเฟรชหน้าคง countdown
        try {
            localStorage.setItem('otpWaitingData', JSON.stringify({ phoneNumber: account.phoneNumber, startTime: now }));
        }
        catch (_a) { }
    };
    const handleSubmitOtp = (otp) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield api_1.default.post('/automation/submit-otp', {
                phoneNumber: otpDialog.phoneNumber,
                otp,
            });
            setMessage('ส่ง OTP สำเร็จ');
            setMessageType('success');
            // ปิด dialog
            setOtpDialog({ phoneNumber: '', open: false });
            // อัปเดตสถานะบัญชีให้ pending อีกครั้ง รอผลลัพธ์สุดท้าย
            setAccounts(prev => prev.map(acc => acc.phoneNumber === otpDialog.phoneNumber ? Object.assign(Object.assign({}, acc), { status: 'pending' }) : acc));
            // แสดง Backdrop ระหว่างรอผลลัพธ์หลังส่ง OTP
            setWaitingPhoneNumber(otpDialog.phoneNumber);
            setWaitStartTime(Date.now());
            setShowManualOtp(false);
            // ล้าง timestamp ของ OTP เพราะกรอกเสร็จแล้ว
            try {
                localStorage.removeItem('otpWaitingData');
            }
            catch (_a) { }
        }
        catch (error) {
            console.error('ส่ง OTP ไม่สำเร็จ', error);
            setMessage('เกิดข้อผิดพลาดในการส่ง OTP');
            setMessageType('error');
        }
    });
    const closeOtpDialog = () => setOtpDialog({ phoneNumber: '', open: false });
    // แสดงปุ่มกรอก OTP เองหลังรอครบ 60 วินาที
    (0, react_1.useEffect)(() => {
        if (!waitingPhoneNumber) {
            setShowManualOtp(false);
            return;
        }
        const timer = setTimeout(() => setShowManualOtp(true), 60000);
        return () => clearTimeout(timer);
    }, [waitingPhoneNumber, waitStartTime]);
    // ฟังก์ชันสำหรับขอ OTP
    const handleRequestOtp = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield api_1.default.post('/automation/request-otp', {
                phoneNumber: phoneNumber,
            });
            setMessage('ร้องขอ OTP เรียบร้อยแล้ว กรุณารอรับ SMS');
            setMessageType('success');
            setShowRequestOtp(false);
        }
        catch (error) {
            console.error('Failed to request OTP:', error);
            setMessage('เกิดข้อผิดพลาดในการร้องขอ OTP');
            setMessageType('error');
        }
    });
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
          {accounts.map((account) => (<AccountCard_1.default key={account.id} account={account} onEdit={handleEditAccount} onDelete={handleDeleteAccount} onRetry={handleRetryAccount}/>))}
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

      {/* OTP Dialog */}
      <OtpDialog_1.default open={otpDialog.open} phoneNumber={otpDialog.phoneNumber} onSubmit={handleSubmitOtp} onClose={closeOtpDialog}/>

      {/* Backdrop while waiting for awaitingOtp */}
      <material_1.Backdrop open={waitingPhoneNumber !== null} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <material_1.Box textAlign="center">
          <material_1.CircularProgress color="inherit"/>
          <material_1.Typography variant="h6" mt={2}>
            กำลังสมัครบัญชี LINE สำหรับ {waitingPhoneNumber}
          </material_1.Typography>
          {showRequestOtp && waitingPhoneNumber && (<material_1.Button variant="outlined" sx={{ mt: 2, mr: 2, color: '#fff', borderColor: '#fff' }} onClick={() => handleRequestOtp(waitingPhoneNumber)}>
              ขอ OTP
            </material_1.Button>)}
          {showManualOtp && (<material_1.Button variant="outlined" sx={{ mt: 2, color: '#fff', borderColor: '#fff' }} onClick={() => {
                const account = accounts.find((a) => a.phoneNumber === waitingPhoneNumber);
                if (account)
                    handleOpenOtp(account);
            }}>
              กรอก OTP เอง
            </material_1.Button>)}
        </material_1.Box>
      </material_1.Backdrop>

      {/* Snackbar for messages */}
      <material_1.Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <material_1.Alert severity={messageType} onClose={() => setMessage(null)}>
          {message}
        </material_1.Alert>
      </material_1.Snackbar>
    </material_1.Container>);
}
exports.default = HomePage;
