'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { NumberSet } from '@/types/numberSet';
import api from '@/lib/api';

export default function AddFriendsPage() {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [phoneLists, setPhoneLists] = useState<NumberSet[]>([]);
  const [accountId, setAccountId] = useState('');
  const [phoneListId, setPhoneListId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);
  const [jobId, setJobId] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, listRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/phone-lists'),
        ]);
        setAccounts(
          accRes.data.map((a: any) => ({
            id: a._id,
            name: a.displayName || a.phoneNumber || a.userId,
          }))
        );
        const lists: NumberSet[] = listRes.data.map((l: any) => ({
          id: l._id,
          name: l.name,
          inputType: l.inputType,
          rawData: l.rawData,
          chunks: l.chunks,
          createdAt: l.createdAt,
        }));
        setPhoneLists(lists);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

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
    if (!accountId || !phoneListId) return;
    setLoading(true);
    try {
      const res = await api.post('/add-friends', { accountId, phoneListId });
      setMessage('เพิ่มเพื่อนสำเร็จ');
      setAccountId('');
      setPhoneListId('');
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
        <FormControl fullWidth>
          <InputLabel>บัญชี</InputLabel>
          <Select
            value={accountId}
            label="บัญชี"
            onChange={(e) => setAccountId(e.target.value as string)}
          >
            {accounts.map((acc) => (
              <MenuItem key={acc.id} value={acc.id}>
                {acc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>ชุดเบอร์</InputLabel>
          <Select
            value={phoneListId}
            label="ชุดเบอร์"
            onChange={(e) => setPhoneListId(e.target.value as string)}
          >
            {phoneLists.map((list) => (
              <MenuItem key={list.id} value={list.id}>
                {list.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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