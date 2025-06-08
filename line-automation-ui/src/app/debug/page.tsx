'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import api from '@/lib/api';

export default function DebugPage() {
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testStatus, setTestStatus] = useState('awaiting_otp');

  useEffect(() => {
    const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!rawWsUrl) {
      console.warn('NEXT_PUBLIC_WS_URL is not defined');
      return;
    }

    const wsUrl = rawWsUrl.replace(/^http/, 'ws');
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setWsStatus('connected');
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        setWsMessages(prev => [data, ...prev.slice(0, 9)]); // เก็บ 10 ข้อความล่าสุด
      } catch (err) {
        console.error('Invalid WS message', err);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setWsStatus('disconnected');
    };

    return () => {
      socket.close();
    };
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
      console.log('Accounts from API:', response.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhoneNumber) return;
    
    try {
      await api.post('/automation/status', {
        status: testStatus,
        message: `Test status update for ${testPhoneNumber}`,
        details: { phoneNumber: testPhoneNumber }
      });
      console.log('Test message sent');
    } catch (error) {
      console.error('Failed to send test message:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Debug Page
      </Typography>

      <Stack spacing={3}>
        {/* WebSocket Status */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            WebSocket Status
          </Typography>
          <Alert severity={wsStatus === 'connected' ? 'success' : 'error'}>
            Status: {wsStatus}
          </Alert>
          <Typography variant="body2" sx={{ mt: 1 }}>
            URL: {process.env.NEXT_PUBLIC_WS_URL?.replace(/^http/, 'ws')}
          </Typography>
        </Paper>

        {/* API Test */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            API Test
          </Typography>
          <Button variant="contained" onClick={fetchAccounts} sx={{ mb: 2 }}>
            Fetch Accounts
          </Button>
          <Typography variant="body2">
            Accounts count: {accounts.length}
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
            <pre>{JSON.stringify(accounts, null, 2)}</pre>
          </Box>
        </Paper>

        {/* Test WebSocket Message */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Test WebSocket Message
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Phone Number"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              size="small"
            />
            <TextField
              label="Status"
              value={testStatus}
              onChange={(e) => setTestStatus(e.target.value)}
              size="small"
            />
            <Button variant="contained" onClick={sendTestMessage}>
              Send Test
            </Button>
          </Stack>
        </Paper>

        {/* WebSocket Messages */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent WebSocket Messages
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {wsMessages.map((msg, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date().toLocaleTimeString()}
                </Typography>
                <pre style={{ fontSize: '12px', margin: 0 }}>
                  {JSON.stringify(msg, null, 2)}
                </pre>
              </Box>
            ))}
          </Box>
        </Paper>
      </Stack>
    </Container>
  );
} 