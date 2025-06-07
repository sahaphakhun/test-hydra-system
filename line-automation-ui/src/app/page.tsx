'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Fab,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import AccountCard from '@/components/ui/AccountCard';
import CreateAccountDialog from '@/components/ui/CreateAccountDialog';
import { Account, CreateAccountData } from '@/types/account';
import api from '@/lib/api';

export default function HomePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // โหลดข้อมูลบัญชีจาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    const savedAccounts = localStorage.getItem('line-accounts');
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts));
      } catch (error) {
        console.error('Failed to parse saved accounts:', error);
      }
    }
  }, []);

  // บันทึกข้อมูลบัญชีลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('line-accounts', JSON.stringify(accounts));
  }, [accounts]);

  const handleCreateAccount = async (data: CreateAccountData) => {
    try {
      // เรียก API สร้างบัญชี
      await api.post('/automation/register', data);
      
      // สร้างบัญชีใหม่ใน state
      const newAccount: Account = {
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
