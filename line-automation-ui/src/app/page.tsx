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
  const [otpDialog, setOtpDialog] = useState<{ phoneNumber: string; open: boolean }>({ phoneNumber: '', open: false });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [waitingPhoneNumber, setWaitingPhoneNumber] = useState<string | null>(null);

  // โหลดข้อมูลบัญชีจาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    const savedAccounts = localStorage.getItem('line-accounts');
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts));
        // if there is account awaiting otp, open dialog automatically
        const parsed: Account[] = JSON.parse(savedAccounts);
        const awaiting = parsed.find((acc) => acc.status === 'awaitingOtp');
        if (awaiting) {
          setOtpDialog({ phoneNumber: awaiting.phoneNumber, open: true });
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
          const normalizedStatus = (rawStatus === 'otpWait' || rawStatus === 'otp_wait') ? 'awaitingOtp' : (rawStatus as Account['status']);

          // อัปเดตสถานะใน state
          setAccounts(prev => prev.map(acc => acc.phoneNumber === data.phoneNumber ? { ...acc, status: normalizedStatus } : acc));

          if (normalizedStatus === 'awaitingOtp') {
            setOtpDialog({ phoneNumber: data.phoneNumber, open: true });
            setWaitingPhoneNumber(null);
          } else if (['success', 'error', 'timeout'].includes(normalizedStatus)) {
            setWaitingPhoneNumber(null);
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
      });
      
      setWaitingPhoneNumber(data.phoneNumber);
      
      // สร้างบัญชีใหม่ใน state
      const newAccount: Account = {
        id: data.phoneNumber, // ใช้ phoneNumber เพื่อป้องกันสับสน
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
    } catch (error) {
      console.error('ส่ง OTP ไม่สำเร็จ', error);
      setMessage('เกิดข้อผิดพลาดในการส่ง OTP');
      setMessageType('error');
    }
  };

  const closeOtpDialog = () => setOtpDialog({ phoneNumber: '', open: false });

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

      {/* Backdrop while waiting for awaitingOtp */}
      <Backdrop open={waitingPhoneNumber !== null} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Box textAlign="center">
          <CircularProgress color="inherit" />
          <Typography variant="h6" mt={2}>
            กำลังรอ OTP สำหรับ {waitingPhoneNumber}
          </Typography>
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
