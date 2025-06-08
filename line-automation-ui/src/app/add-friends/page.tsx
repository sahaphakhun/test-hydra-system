'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Button, Stack, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel, LinearProgress } from '@mui/material';
import api from '@/lib/api';

export default function AddFriendsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [listId, setListId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);
  const [progress, setProgress] = useState<{ processed: number; total: number; status: string } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [accRes, listRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/phone-lists'),
        ]);
        setAccounts(accRes.data);
        setLists(listRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!jobId) return;
    const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!rawWsUrl) return;
    const wsUrl = rawWsUrl.replace(/^http/, 'ws');
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'addFriendsUpdate' && data.payload.id === jobId) {
          setProgress({ processed: data.payload.processed, total: data.payload.total, status: data.payload.status });
          if (data.payload.status === 'completed') {
            socket.close();
            setLoading(false);
            setMessage('เพิ่มเพื่อนเสร็จสิ้น');
          }
        }
      } catch {}
    };
    socket.onerror = console.error;
    return () => socket.close();
  }, [jobId]);

  const handleSubmit = async () => {
    const list = lists.find((l: any) => l._id === listId);
    if (!accountId || !list) return;

    setLoading(true);
    setProgress({ processed: 0, total: list.phoneNumbers.length, status: 'running' });
    try {
      const res = await api.post('/add-friends', { accountId, ids: list.phoneNumbers });
      setJobId(res.data.jobId);
    } catch {
      setLoading(false);
      setMessage('เกิดข้อผิดพลาด');
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
          <Select value={accountId} label="บัญชี" onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map(acc => (
              <MenuItem key={acc._id} value={acc._id}>{acc.displayName || acc.phoneNumber}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>ชุดเบอร์</InputLabel>
          <Select value={listId} label="ชุดเบอร์" onChange={(e) => setListId(e.target.value)}>
            {lists.map(list => (
              <MenuItem key={list._id} value={list._id}>{list.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !accountId || !listId}>
          {loading ? 'กำลังเพิ่ม…' : 'เพิ่มเพื่อน'}
        </Button>
        {progress && (
          <LinearProgress variant="determinate" value={(progress.processed / progress.total) * 100} />
        )}
      </Stack>
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={message === 'เพิ่มเพื่อนเสร็จสิ้น' ? 'success' : 'error'}>{message}</Alert>
      </Snackbar>
    </Container>
  );
} 