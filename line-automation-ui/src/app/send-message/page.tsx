'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import api from '@/lib/api';

export default function SendMessagePage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | string>(false);
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState('');

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
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/send-message', { message });
      setSuccess('ส่งข้อความสำเร็จ');
      setMessage('');
      if (res.data.jobId) setJobId(res.data.jobId);
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
      {jobId && (
        <Typography mt={2}>สถานะงาน: {jobStatus || 'pending'}</Typography>
      )}

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