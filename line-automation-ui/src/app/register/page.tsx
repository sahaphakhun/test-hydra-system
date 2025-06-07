'use client';

import { useState } from 'react';
import { Container, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import api from '@/lib/api';

export default function RegisterPage() {
  const [lineId, setLineId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);

  const handleSubmit = async () => {
    if (!lineId.trim() || !displayName.trim()) return;
    setLoading(true);
    try {
      await api.post('/register', { lineId, displayName });
      setMessage('ลงทะเบียนสำเร็จ');
      setLineId('');
      setDisplayName('');
    } catch {
      setMessage('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        ลงทะเบียนบัญชี LINE
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="LINE ID"
          value={lineId}
          onChange={(e) => setLineId(e.target.value)}
        />
        <TextField
          label="ชื่อที่แสดง"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังลงทะเบียน…' : 'ลงทะเบียน'}
        </Button>
      </Stack>
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={message === 'ลงทะเบียนสำเร็จ' ? 'success' : 'error'}>{message}</Alert>
      </Snackbar>
    </Container>
  );
} 