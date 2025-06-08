'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  ChipProps,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Visibility,
  Delete,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import api from '@/lib/api';

interface RegistrationRequest {
  _id: string;
  phoneNumber: string;
  displayName: string;
  password: string;
  proxy?: string;
  autoLogout: boolean;
  status: 'pending' | 'processing' | 'awaiting_otp' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  otpRequested: boolean;
  otpRequestedAt?: string;
  adminNotes?: string;
}

export default function AdminPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [createAccountDialog, setCreateAccountDialog] = useState(false);
  const [actualDisplayName, setActualDisplayName] = useState('');
  const [actualPassword, setActualPassword] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // โหลดข้อมูลคำขอลงทะเบียน
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/registration-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // แสดงรายละเอียดคำขอ
  const handleViewDetails = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setDetailDialog(true);
  };

  // อัปเดตสถานะคำขอ
  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await api.put(`/admin/registration-requests/${requestId}/status`, {
        status,
        adminNotes,
      });
      setMessage('อัปเดตสถานะสำเร็จ');
      setMessageType('success');
      fetchRequests();
      setDetailDialog(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      setMessage('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      setMessageType('error');
    }
  };

  // เปิด dialog สร้างบัญชี
  const handleOpenCreateAccount = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setActualDisplayName(request.displayName);
    setActualPassword(request.password);
    setCreateAccountDialog(true);
  };

  // สร้างบัญชี LINE จากคำขอ
  const handleCreateAccount = async () => {
    if (!selectedRequest) return;

    try {
      await api.post(`/admin/registration-requests/${selectedRequest._id}/create-account`, {
        actualDisplayName,
        actualPassword,
      });
      setMessage('สร้างบัญชีสำเร็จ');
      setMessageType('success');
      fetchRequests();
      setCreateAccountDialog(false);
      setActualDisplayName('');
      setActualPassword('');
    } catch (error) {
      console.error('Failed to create account:', error);
      setMessage('เกิดข้อผิดพลาดในการสร้างบัญชี');
      setMessageType('error');
    }
  };

  // ลบคำขอ
  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบคำขอนี้?')) return;

    try {
      await api.delete(`/admin/registration-requests/${requestId}`);
      setMessage('ลบคำขอสำเร็จ');
      setMessageType('success');
      fetchRequests();
    } catch (error) {
      console.error('Failed to delete request:', error);
      setMessage('เกิดข้อผิดพลาดในการลบคำขอ');
      setMessageType('error');
    }
  };

  // แสดงสี Chip ตามสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'awaiting_otp': return 'secondary';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // แสดงข้อความสถานะ
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'processing': return 'กำลังดำเนินการ';
      case 'awaiting_otp': return 'รอ OTP';
      case 'completed': return 'เสร็จสิ้น';
      case 'failed': return 'ล้มเหลว';
      default: return status;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Admin Dashboard - คำขอลงทะเบียน LINE
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchRequests}
          disabled={loading}
        >
          รีเฟรช
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>กำลังโหลดข้อมูล...</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>เบอร์โทรศัพท์</TableCell>
                <TableCell>ชื่อแสดง</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>วันที่ขอ</TableCell>
                <TableCell>OTP ร้องขอ</TableCell>
                <TableCell align="center">การจัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>{request.phoneNumber}</TableCell>
                  <TableCell>{request.displayName}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(request.status)}
                      color={getStatusColor(request.status) as ChipProps['color']}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(request.requestedAt).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell>
                    {request.otpRequested ? (
                      <Chip label="ร้องขอแล้ว" color="success" size="small" />
                    ) : (
                      <Chip label="ยังไม่ร้องขอ" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="ดูรายละเอียด">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {request.status === 'processing' && (
                      <Tooltip title="สร้างบัญชี">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenCreateAccount(request)}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="ลบคำขอ">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRequest(request._id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog รายละเอียดคำขอ */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>รายละเอียดคำขอลงทะเบียน</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="เบอร์โทรศัพท์"
                  value={selectedRequest.phoneNumber}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ชื่อแสดง"
                  value={selectedRequest.displayName}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="รหัสผ่าน"
                  value={selectedRequest.password}
                  fullWidth
                  disabled
                  type="password"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Proxy"
                  value={selectedRequest.proxy || 'ไม่มี'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="สถานะ"
                  value={getStatusText(selectedRequest.status)}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="วันที่ขอ"
                  value={new Date(selectedRequest.requestedAt).toLocaleString('th-TH')}
                  fullWidth
                  disabled
                />
              </Grid>
              {selectedRequest.otpRequestedAt && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="วันที่ร้องขอ OTP"
                    value={new Date(selectedRequest.otpRequestedAt).toLocaleString('th-TH')}
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="หมายเหตุของ Admin"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="เพิ่มหมายเหตุ..."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>ปิด</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleUpdateStatus(selectedRequest?._id || '', 'processing')}
          >
            เปลี่ยนเป็น “กำลังดำเนินการ”
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleUpdateStatus(selectedRequest?._id || '', 'failed')}
          >
            เปลี่ยนเป็น “ล้มเหลว”
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog สร้างบัญชี */}
      <Dialog open={createAccountDialog} onClose={() => setCreateAccountDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>สร้างบัญชี LINE</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="ชื่อแสดงจริง (จาก LINE)"
                value={actualDisplayName}
                onChange={(e) => setActualDisplayName(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="รหัสผ่านจริง (จาก LINE)"
                value={actualPassword}
                onChange={(e) => setActualPassword(e.target.value)}
                fullWidth
                required
                type="password"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAccountDialog(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={handleCreateAccount}
            disabled={!actualDisplayName.trim() || !actualPassword.trim()}
          >
            สร้างบัญชี
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={messageType} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 