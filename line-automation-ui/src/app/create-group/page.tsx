'use client';

import { useState } from 'react';
import { Container, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import api from '@/lib/api';

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);

  const handleSubmit = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      await api.post('/create-group', { name: groupName });
      setMessage('สร้างกลุ่มสำเร็จ');
      setGroupName('');
    } catch {
      setMessage('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        สร้างกลุ่ม LINE
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="ชื่อกลุ่ม"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังสร้าง…' : 'สร้างกลุ่ม'}
        </Button>
      </Stack>
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={message === 'สร้างกลุ่มสำเร็จ' ? 'success' : 'error'}>{message}</Alert>
      </Snackbar>
    </Container>
  );
} 