'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Fab,
  Box,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
  Button,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import AccountCard from '@/components/ui/AccountCard';
import CreateAccountDialog from '@/components/ui/CreateAccountDialog';
import { Account, CreateAccountData } from '@/types/account';
import api from '@/lib/api';
import OtpDialog from '@/components/ui/OtpDialog';

export default function HomePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [otpDialog, setOtpDialog] = useState<{ phoneNumber: string; open: boolean; startTime?: number }>({ phoneNumber: '', open: false });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [waitingPhoneNumber, setWaitingPhoneNumber] = useState<string | null>(null);
  const [waitStartTime, setWaitStartTime] = useState<number | null>(null);
  const [showManualOtp, setShowManualOtp] = useState(false);
  const [showRequestOtp, setShowRequestOtp] = useState(false);

  // โหลดข้อมูลบัญชีจาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    const savedAccounts = localStorage.getItem('line-accounts');
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts));
        // if there is account awaiting otp, open dialog automatically
        const parsed: Account[] = JSON.parse(savedAccounts);
        const awaiting = parsed.find((acc) => acc.status === 'awaiting_otp');
        if (awaiting) {
          // อ่าน timestamp จาก localStorage หากมี เพื่อรักษา countdown
          let startTime: number | undefined;
          try {
            const raw = localStorage.getItem('otpWaitingData');
            if (raw) {
              const data = JSON.parse(raw);
              if (data.phoneNumber === awaiting.phoneNumber) startTime = data.startTime;
            }
          } catch {}
          setOtpDialog({ phoneNumber: awaiting.phoneNumber, open: true, startTime });
        }
      } catch (error) {
        console.error('Failed to parse saved accounts:', error);
      }
    }
  }, []);

  // บันทึกข้อมูลบัญชีลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('line-accounts', JSON.stringify(accounts));
  }, [accounts]);

  // WebSocket เพื่อติดตามสถานะ
  useEffect(() => {
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
          const rawStatus: string = data.status;
          // แปลงสถานะให้เป็นรูปแบบที่ UI รองรับ
          const normalizedStatus: Account['status'] =
            rawStatus === 'otpWait' || rawStatus === 'otp_wait' || rawStatus === 'waiting_otp'
              ? 'awaiting_otp'
              : rawStatus === 'success'
              ? 'completed'
              : rawStatus === 'error'
              ? 'failed'
              : (rawStatus as Account['status']);

          // อัปเดตสถานะใน state
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.phoneNumber === data.phoneNumber ? { ...acc, status: normalizedStatus } : acc
            )
          );

          if (normalizedStatus === 'awaiting_otp') {
            const now = Date.now();
            // บันทึก timestamp เพื่อให้ reload คง countdown ต่อเนื่อง
            try { localStorage.setItem('otpWaitingData', JSON.stringify({ phoneNumber: data.phoneNumber, startTime: now })); } catch {}
            setOtpDialog({ phoneNumber: data.phoneNumber, open: true, startTime: now });
            setWaitingPhoneNumber(null);
            setWaitStartTime(null);
            setShowManualOtp(false);
            setShowRequestOtp(true); // แสดงปุ่มขอ OTP
          } else if (['completed', 'failed', 'timeout'].includes(normalizedStatus)) {
            // ล้างข้อมูล waiting และ otpWaitingData เมื่อจบ
            setWaitingPhoneNumber(null);
            setWaitStartTime(null);
            setShowManualOtp(false);
            setShowRequestOtp(false);
            try { localStorage.removeItem('otpWaitingData'); } catch {}
          }

          return; // จบ early
        }
      } catch (err) {
        console.error('Invalid WS message', err);
      }
    };

    socket.onerror = console.error;

    return () => {
      socket.close();
    };
  }, []);

  const handleCreateAccount = async (data: CreateAccountData) => {
    try {
      // เรียก API สร้างบัญชี
      await api.post('/automation/register', {
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
      const newAccount: Account = {
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
    } catch (error) {
      console.error('Failed to create account:', error);
      setMessage('เกิดข้อผิดพลาดในการสร้างบัญชี');
      setMessageType('error');
    }
  };

  const handleEditAccount = (account: Account) => {
    // TODO: เปิด dialog แก้ไข
    console.log('Edit account:', account);
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    setMessage('ลบบัญชีสำเร็จ');
    setMessageType('success');
  };

  // ลองสมัครบัญชีใหม่เมื่อเกิดข้อผิดพลาดหรือหมดเวลารอ
  const handleRetryAccount = async (account: Account) => {
    try {
      await api.post('/automation/register', {
        phoneNumber: account.phoneNumber,
        displayName: account.name,
        password: account.password,
        proxy: account.proxy,
      });
      setWaitingPhoneNumber(account.phoneNumber);
      setWaitStartTime(Date.now());
      setShowManualOtp(false);
      setAccounts(prev => prev.map(acc => acc.id === account.id ? { ...acc, status: 'pending' } : acc));
      setMessage('เริ่มสมัครใหม่แล้ว');
      setMessageType('success');
    } catch (error) {
      console.error('Failed to retry registration:', error);
      setMessage('ลองสมัครใหม่ไม่สำเร็จ');
      setMessageType('error');
    }
  };

  /**
   * เปิด dialog เพื่อกรอก OTP สำหรับเบอร์โทรศัพท์ที่ระบุ
   */
  const handleOpenOtp = (account: Account) => {
    const now = Date.now();
    setOtpDialog({ phoneNumber: account.phoneNumber, open: true, startTime: now });
    // ยกเลิกการแสดง Backdrop ระหว่างกรอก OTP
    setWaitingPhoneNumber(null);
    // เก็บ timestamp เพื่อให้รีเฟรชหน้าคง countdown
    try { localStorage.setItem('otpWaitingData', JSON.stringify({ phoneNumber: account.phoneNumber, startTime: now })); } catch {}
  };

  const handleSubmitOtp = async (otp: string) => {
    try {
      await api.post('/automation/submit-otp', {
        phoneNumber: otpDialog.phoneNumber,
        otp,
      });
      setMessage('ส่ง OTP สำเร็จ');
      setMessageType('success');
      // ปิด dialog
      setOtpDialog({ phoneNumber: '', open: false });
      // อัปเดตสถานะบัญชีให้ pending อีกครั้ง รอผลลัพธ์สุดท้าย
      setAccounts(prev => prev.map(acc => acc.phoneNumber === otpDialog.phoneNumber ? { ...acc, status: 'pending' } : acc));

      // แสดง Backdrop ระหว่างรอผลลัพธ์หลังส่ง OTP
      setWaitingPhoneNumber(otpDialog.phoneNumber);
      setWaitStartTime(Date.now());
      setShowManualOtp(false);

      // ล้าง timestamp ของ OTP เพราะกรอกเสร็จแล้ว
      try { localStorage.removeItem('otpWaitingData'); } catch {}
    } catch (error) {
      console.error('ส่ง OTP ไม่สำเร็จ', error);
      setMessage('เกิดข้อผิดพลาดในการส่ง OTP');
      setMessageType('error');
    }
  };

  const closeOtpDialog = () => setOtpDialog({ phoneNumber: '', open: false });

  // แสดงปุ่มกรอก OTP เองหลังรอครบ 60 วินาที
  useEffect(() => {
    if (!waitingPhoneNumber) {
      setShowManualOtp(false);
      return;
    }
    const timer = setTimeout(() => setShowManualOtp(true), 60000);
    return () => clearTimeout(timer);
  }, [waitingPhoneNumber, waitStartTime]);

  // ฟังก์ชันสำหรับขอ OTP
  const handleRequestOtp = async (phoneNumber: string) => {
    try {
      await api.post('/automation/request-otp', {
        phoneNumber: phoneNumber,
      });
      setMessage('ร้องขอ OTP เรียบร้อยแล้ว กรุณารอรับ SMS');
      setMessageType('success');
      setShowRequestOtp(false);
    } catch (error) {
      console.error('Failed to request OTP:', error);
      setMessage('เกิดข้อผิดพลาดในการร้องขอ OTP');
      setMessageType('error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          จัดการบัญชี LINE
        </Typography>
        <Typography variant="body1" color="text.secondary">
          สร้างและจัดการบัญชี LINE สำหรับระบบ Automation
        </Typography>
      </Box>

      {accounts.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          textAlign="center"
        >
          <Typography variant="h6" color="text.secondary" mb={2}>
            ยังไม่มีบัญชี LINE
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            เริ่มต้นด้วยการสร้างบัญชี LINE ใหม่
          </Typography>
          <Fab
            color="primary"
            onClick={() => setDialogOpen(true)}
            sx={{ mb: 2 }}
          >
            <Add />
          </Fab>
        </Box>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
          gap={3}
        >
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
              onRetry={handleRetryAccount}
            />
          ))}
        </Box>
      )}

      {/* Floating Action Button */}
      {accounts.length > 0 && (
        <Fab
          color="primary"
          onClick={() => setDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Create Account Dialog */}
      <CreateAccountDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateAccount}
      />

      {/* OTP Dialog */}
      <OtpDialog
        open={otpDialog.open}
        phoneNumber={otpDialog.phoneNumber}
        onSubmit={handleSubmitOtp}
        onClose={closeOtpDialog}
      />

      {/* Backdrop while waiting for awaiting_otp */}
      <Backdrop open={waitingPhoneNumber !== null} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Box textAlign="center">
          <CircularProgress color="inherit" />
          <Typography variant="h6" mt={2}>
            กำลังสมัครบัญชี LINE สำหรับ {waitingPhoneNumber}
          </Typography>
          {showRequestOtp && waitingPhoneNumber && (
            <Button
              variant="outlined"
              sx={{ mt: 2, mr: 2, color: '#fff', borderColor: '#fff' }}
              onClick={() => handleRequestOtp(waitingPhoneNumber)}
            >
              ขอ OTP
            </Button>
          )}
          {showManualOtp && (
            <Button
              variant="outlined"
              sx={{ mt: 2, color: '#fff', borderColor: '#fff' }}
              onClick={() => {
                const account = accounts.find((a) => a.phoneNumber === waitingPhoneNumber);
                if (account) handleOpenOtp(account);
              }}
            >
              กรอก OTP เอง
            </Button>
          )}
        </Box>
      </Backdrop>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={messageType} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
