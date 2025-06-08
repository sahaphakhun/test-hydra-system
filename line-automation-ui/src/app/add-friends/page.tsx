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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Add, Visibility, Refresh } from '@mui/icons-material';
import type { NumberSet } from '@/types/numberSet';
import api from '@/lib/api';

interface Job {
  _id: string;
  type: string;
  accountId?: string;
  data: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AddFriendsPage() {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [phoneLists, setPhoneLists] = useState<NumberSet[]>([]);
  const [accountId, setAccountId] = useState('');
  const [phoneListId, setPhoneListId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);
  const [jobId, setJobId] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
          // รีเฟรชรายการงาน
          fetchJobs();
        }
      } catch {}
    };
    return () => ws.close();
  }, [jobId]);

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

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await api.get('/jobs?type=add_friends');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchJobs();
  }, []);

  const handleSubmit = async () => {
    if (!accountId || !phoneListId) return;
    setLoading(true);
    try {
      const res = await api.post('/add-friends', { accountId, phoneListId });
      setMessage('เพิ่มเพื่อนสำเร็จ');
      setAccountId('');
      setPhoneListId('');
      setShowCreateForm(false);
      if (res.data.jobId) setJobId(res.data.jobId);
      // รีเฟรชรายการงาน
      fetchJobs();
    } catch {
      setMessage('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'completed': return 'เสร็จสมบูรณ์';
      case 'failed': return 'ล้มเหลว';
      default: return status;
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'ไม่ทราบ';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          เพิ่มเพื่อน LINE
        </Typography>
        <Stack direction="row" spacing={2}>
          <Tooltip title="รีเฟรชข้อมูล">
            <IconButton onClick={fetchJobs} disabled={jobsLoading}>
              {jobsLoading ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
          >
            เพิ่มเพื่อนใหม่
          </Button>
        </Stack>
      </Box>

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>เพิ่มเพื่อน LINE</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
                    {list.name} ({list.chunks.flat().length} เบอร์)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateForm(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังเพิ่ม...' : 'เพิ่มเพื่อน'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Jobs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>บัญชี</TableCell>
              <TableCell>จำนวนเบอร์</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>วันที่สร้าง</TableCell>
              <TableCell>วันที่อัปเดต</TableCell>
              <TableCell align="center">การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobsLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    ยังไม่มีงานเพิ่มเพื่อน
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job._id} hover>
                  <TableCell>
                    <Chip 
                      label={getAccountName(job.accountId || '')} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography>{job.data?.numbers?.length || 0} เบอร์</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(job.status)}
                      color={getStatusColor(job.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(job.createdAt).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell>
                    {new Date(job.updatedAt).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="ดูรายละเอียด">
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {jobId && (
        <Box mt={2}>
          <Typography>สถานะงานล่าสุด: {jobStatus || 'pending'}</Typography>
        </Box>
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