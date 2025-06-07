'use client';

import { useState } from 'react';
import { Container, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import api from '@/lib/api';

export default function SendMessagePage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | string>(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await api.post('/automation/submit-otp', { otp: message });
      setSuccess('ส่งข้อความสำเร็จ');
      setMessage('');
    } catch {
      setSuccess('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        ส่งข้อความ
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="ข้อความ"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          rows={4}
        />
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังส่ง...' : 'ส่งข้อความ'}
        </Button>
      </Stack>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={success === 'ส่งข้อความสำเร็จ' ? 'success' : 'error'}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
} 