'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import api from '@/lib/api';

export default function AddFriendsPage() {
  const [userIds, setUserIds] = useState(''); // comma separated
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);
  const [jobId, setJobId] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<string>('');

  useEffect(() => {
    if (!jobId) return;
    const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!rawWsUrl) return;
    const ws = new WebSocket(rawWsUrl.replace(/^http/, 'ws'));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS_UPDATE' && data.payload?.jobId === jobId) {
          setJobStatus(data.payload.status);
        }
      } catch {}
    };
    return () => ws.close();
  }, [jobId]);

  const handleSubmit = async () => {
    const ids = userIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (!ids.length) return;

    setLoading(true);
    try {
      const res = await api.post('/add-friends', { ids });
      setMessage('เพิ่มเพื่อนสำเร็จ');
      setUserIds('');
      if (res.data.jobId) setJobId(res.data.jobId);
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
      {jobId && (
        <Typography mt={2}>สถานะงาน: {jobStatus || 'pending'}</Typography>
      )}
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