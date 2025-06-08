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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
import { Add, Visibility, Delete, Refresh } from '@mui/icons-material';
import api from '@/lib/api';

interface LineAccount {
  _id: string;
  displayName: string;
  userId: string;
  phoneNumber?: string;
}

interface LineGroup {
  _id: string;
  name: string;
  accountId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | boolean>(false);
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [accounts, setAccounts] = useState<LineAccount[]>([]);
  const [accountId, setAccountId] = useState('');
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; group: LineGroup | null }>({ open: false, group: null });

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

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
      if (res.data.length > 0 && !accountId) {
        setAccountId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllGroups = async () => {
    setGroupsLoading(true);
    try {
      // ดึงกลุ่มจากทุกบัญชี
      const groupPromises = accounts.map(account => 
        api.get(`/accounts/${account._id}/groups`).catch(() => ({ data: [] }))
      );
      const groupResults = await Promise.all(groupPromises);
      
      const allGroups: LineGroup[] = [];
      groupResults.forEach((result, index) => {
        if (result.data) {
          result.data.forEach((group: any) => {
            allGroups.push({
              ...group,
              accountId: accounts[index]._id
            });
          });
        }
      });
      
      setGroups(allGroups);
    } catch (err) {
      console.error(err);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchAllGroups();
    }
  }, [accounts]);

  const handleSubmit = async () => {
    if (!groupName.trim() || !accountId) return;
    setLoading(true);
    try {
      const res = await api.post('/create-group', { name: groupName, accountId });
      setMessage('สร้างกลุ่มสำเร็จ');
      setGroupName('');
      setShowCreateForm(false);
      if (res.data.jobId) setJobId(res.data.jobId);
      // รีเฟรชรายการกลุ่ม
      fetchAllGroups();
    } catch {
      setMessage('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await api.delete(`/groups/${groupId}`);
      setMessage('ลบกลุ่มสำเร็จ');
      setDeleteDialog({ open: false, group: null });
      fetchAllGroups();
    } catch {
      setMessage('เกิดข้อผิดพลาดในการลบกลุ่ม');
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc._id === accountId);
    return account?.displayName || account?.phoneNumber || account?.userId || 'ไม่ทราบ';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          จัดการกลุ่ม LINE
        </Typography>
        <Stack direction="row" spacing={2}>
          <Tooltip title="รีเฟรชข้อมูล">
            <IconButton onClick={fetchAllGroups} disabled={groupsLoading}>
              {groupsLoading ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
          >
            สร้างกลุ่มใหม่
          </Button>
        </Stack>
      </Box>

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>สร้างกลุ่ม LINE ใหม่</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>บัญชี LINE</InputLabel>
              <Select
                value={accountId}
                label="บัญชี LINE"
                onChange={(e) => setAccountId(e.target.value as string)}
              >
                {accounts.map((acc) => (
                  <MenuItem key={acc._id} value={acc._id}>
                    {acc.displayName || acc.phoneNumber || acc.userId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="ชื่อกลุ่ม"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateForm(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Groups Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ชื่อกลุ่ม</TableCell>
              <TableCell>บัญชีเจ้าของ</TableCell>
              <TableCell>จำนวนสมาชิก</TableCell>
              <TableCell>วันที่สร้าง</TableCell>
              <TableCell align="center">การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupsLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    ยังไม่มีกลุ่ม
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group._id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{group.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getAccountName(group.accountId)} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography>{group.memberCount} คน</Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(group.createdAt).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="ดูรายละเอียด">
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบกลุ่ม">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => setDeleteDialog({ open: true, group })}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, group: null })}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบกลุ่ม "{deleteDialog.group?.name}" หรือไม่?
          </Typography>
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            การดำเนินการนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, group: null })}>ยกเลิก</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => deleteDialog.group && handleDeleteGroup(deleteDialog.group._id)}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

      {jobId && (
        <Box mt={2}>
          <Typography>สถานะงาน: {jobStatus || 'pending'}</Typography>
        </Box>
      )}

      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={message === 'สร้างกลุ่มสำเร็จ' || message === 'ลบกลุ่มสำเร็จ' ? 'success' : 'error'}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 