'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import api from '@/lib/api';

export default function SendMessagePage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | string>(false);
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [groupId, setGroupId] = useState('');

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

  // โหลดรายการบัญชี
  useEffect(() => {
    api
      .get('/accounts')
      .then((res) => setAccounts(res.data))
      .catch(() => {});
  }, []);

  // โหลดกลุ่มเมื่อเลือกบัญชี
  useEffect(() => {
    if (!accountId) {
      setGroups([]);
      setGroupId('');
      return;
    }
    api
      .get(`/accounts/${accountId}/groups`)
      .then((res) => setGroups(res.data))
      .catch(() => setGroups([]));
  }, [accountId]);

  const handleSubmit = async () => {
    if (!message.trim() || !accountId || !groupId) return;
    setLoading(true);
    try {
      const res = await api.post('/send-message', { accountId, groupId, message });
      setSuccess('ส่งข้อความสำเร็จ');
      setMessage('');
      setGroupId('');
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
        <FormControl fullWidth>
          <InputLabel>บัญชี</InputLabel>
          <Select
            value={accountId}
            label="บัญชี"
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((acc) => (
              <MenuItem key={acc._id} value={acc._id}>
                {acc.displayName || acc.phoneNumber || acc._id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth disabled={!accountId}>
          <InputLabel>กลุ่ม</InputLabel>
          <Select
            value={groupId}
            label="กลุ่ม"
            onChange={(e) => setGroupId(e.target.value)}
          >
            {groups.map((g) => (
              <MenuItem key={g._id} value={g._id}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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