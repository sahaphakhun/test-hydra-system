'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import api from '@/lib/api';

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);
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
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/create-group', { name: groupName });
      setMessage('สร้างกลุ่มสำเร็จ');
      setGroupName('');
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
      {jobId && (
        <Typography mt={2}>สถานะงาน: {jobStatus || 'pending'}</Typography>
      )}
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