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

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await api.get('/admin/jobs?type=send_message');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || !accountId || !groupId) return;
    setLoading(true);
    try {
      const res = await api.post('/send-message', { accountId, groupId, message });
      setSuccess('ส่งข้อความสำเร็จ');
      setMessage('');
      setGroupId('');
      setShowCreateForm(false);
      if (res.data.jobId) setJobId(res.data.jobId);
      // รีเฟรชรายการงาน
      fetchJobs();
    } catch {
      setSuccess('เกิดข้อผิดพลาด');
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
    const account = accounts.find(acc => acc._id === accountId);
    return account?.displayName || account?.phoneNumber || account?.userId || 'ไม่ทราบ';
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g._id === groupId);
    return group?.name || 'ไม่ทราบ';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          ส่งข้อความ LINE
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
            ส่งข้อความใหม่
          </Button>
        </Stack>
      </Box>

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ส่งข้อความ LINE</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateForm(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังส่ง...' : 'ส่งข้อความ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Jobs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>บัญชี</TableCell>
              <TableCell>กลุ่ม</TableCell>
              <TableCell>ข้อความ</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>วันที่สร้าง</TableCell>
              <TableCell>วันที่อัปเดต</TableCell>
              <TableCell align="center">การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobsLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    ยังไม่มีงานส่งข้อความ
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
                    <Typography variant="body2">{job.data?.groupId ? getGroupName(job.data.groupId) : 'ไม่ทราบ'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 200, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {job.data?.message || '-'}
                    </Typography>
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