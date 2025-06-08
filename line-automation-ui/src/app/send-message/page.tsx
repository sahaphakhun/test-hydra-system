'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Stack, Snackbar, Alert, MenuItem } from '@mui/material';
import api from '@/lib/api';

export default function SendMessagePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | string>(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/accounts');
        setAccounts(res.data);
      } catch {
        setAccounts([]);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!accountId) {
      setGroups([]);
      setGroupId('');
      return;
    }
    const fetchGroups = async () => {
      try {
        const res = await api.get(`/accounts/${accountId}/groups`);
        setGroups(res.data);
      } catch {
        setGroups([]);
      }
    };
    fetchGroups();
  }, [accountId]);

  const handleSubmit = async () => {
    if (!message.trim() || !accountId || !groupId) return;
    setLoading(true);
    try {
      await api.post('/send-message', { accountId, groupId, message });
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
          select
          label="บัญชี LINE"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((acc) => (
            <MenuItem key={acc._id} value={acc._id}>
              {acc.displayName || acc.phoneNumber}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="กลุ่ม"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          disabled={!accountId}
        >
          {groups.map((group) => (
            <MenuItem key={group._id} value={group._id}>
              {group.name}
            </MenuItem>
          ))}
        </TextField>

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