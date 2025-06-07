'use client';

import { useState } from 'react';
import { Container, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import api from '@/lib/api';

export default function AddFriendsPage() {
  const [userIds, setUserIds] = useState(''); // comma separated
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);

  const handleSubmit = async () => {
    const ids = userIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (!ids.length) return;

    setLoading(true);
    try {
      await api.post('/add-friends', { ids });
      setMessage('เพิ่มเพื่อนสำเร็จ');
      setUserIds('');
    } catch {
      setMessage('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        เพิ่มเพื่อน
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="User IDs (คั่นด้วย ,)"
          value={userIds}
          onChange={(e) => setUserIds(e.target.value)}
          multiline
        />
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังเพิ่ม…' : 'เพิ่มเพื่อน'}
        </Button>
      </Stack>
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={message === 'เพิ่มเพื่อนสำเร็จ' ? 'success' : 'error'}>{message}</Alert>
      </Snackbar>
    </Container>
  );
} 