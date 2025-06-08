'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Close, CheckCircle, Error } from '@mui/icons-material';
import { useState } from 'react';
import { CreateAccountData } from '@/types/account';
import api from '@/lib/api';

interface CreateAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountData) => Promise<void>;
}

export default function CreateAccountDialog({ open, onClose, onSubmit }: CreateAccountDialogProps) {
  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    phoneNumber: '',
    password: '',
    proxy: '',
    autoLogout: true,
  });
  const [loading, setLoading] = useState(false);
  const [proxyStatus, setProxyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [proxyErrorMessage, setProxyErrorMessage] = useState<string>('');

  const handleInputChange = (field: keyof CreateAccountData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (field === 'proxy') {
      setProxyStatus('idle');
    }
  };

  const checkProxy = async () => {
    const proxy = formData.proxy?.trim();
    if (!proxy) return;
    
    // รีเซ็ตข้อความแสดงข้อผิดพลาด
    setProxyErrorMessage('');
    
    // ตรวจสอบรูปแบบเบื้องต้น
    try {
      const url = new URL(proxy);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        setProxyStatus('invalid');
        setProxyErrorMessage('โปรโตคอลต้องเป็น http หรือ https เท่านั้น');
        return;
      }
    } catch {
      setProxyStatus('invalid');
      setProxyErrorMessage('รูปแบบ Proxy ไม่ถูกต้อง');
      return;
    }

    setProxyStatus('checking');
    try {
      // เรียก API เพื่อเช็ก proxy
      const response = await api.post('/automation/check-proxy', { proxy });
      if (response.status === 200) {
        setProxyStatus('valid');
      } else {
        // กรณีที่ API ตอบกลับมา แต่ไม่ใช่ status 200
        setProxyStatus('invalid');
        setProxyErrorMessage(response.data?.message || 'ไม่สามารถใช้งาน Proxy นี้ได้');
      }
    } catch (error: unknown) {
      console.error('Check proxy failed:', error);
      setProxyStatus('invalid');
      
      // จัดการข้อความแสดงข้อผิดพลาด
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as { 
          response?: { 
            data?: { 
              message?: string 
            } 
          };
          message?: string;
        };
        
        if (errorObj.response?.data?.message) {
          setProxyErrorMessage(errorObj.response.data.message);
        } else if (errorObj.message) {
          setProxyErrorMessage(`เกิดข้อผิดพลาด: ${errorObj.message}`);
        } else {
          setProxyErrorMessage('ไม่สามารถเชื่อมต่อกับ API เพื่อตรวจสอบ Proxy');
        }
      } else {
        setProxyErrorMessage('ไม่สามารถเชื่อมต่อกับ API เพื่อตรวจสอบ Proxy');
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phoneNumber.trim() || !formData.password.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        proxy: formData.proxy?.trim() || undefined,
      });
      setFormData({ name: '', phoneNumber: '', password: '', proxy: '', autoLogout: true });
      setProxyStatus('idle');
      onClose();
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', phoneNumber: '', password: '', proxy: '', autoLogout: true });
      setProxyStatus('idle');
      onClose();
    }
  };

  const getProxyIcon = () => {
    switch (proxyStatus) {
      case 'checking':
        return <CircularProgress size={20} />;
      case 'valid':
        return <CheckCircle color="success" />;
      case 'invalid':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">เพิ่มบัญชี LINE ใหม่</Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="ชื่อบัญชี"
            value={formData.name}
            onChange={handleInputChange('name')}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="เบอร์โทรศัพท์"
            value={formData.phoneNumber}
            onChange={handleInputChange('phoneNumber')}
            fullWidth
            required
            disabled={loading}
            placeholder="0812345678"
          />

          <TextField
            label="รหัสผ่าน"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            fullWidth
            required
            disabled={loading}
          />

          <Box>
            <TextField
              label="Proxy (ไม่บังคับ)"
              value={formData.proxy}
              onChange={handleInputChange('proxy')}
              fullWidth
              disabled={loading}
              placeholder="http://user:pass@host:port"
              InputProps={{
                endAdornment: getProxyIcon(),
              }}
            />
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Button
                size="small"
                onClick={checkProxy}
                disabled={!formData.proxy?.trim() || proxyStatus === 'checking' || loading}
              >
                เช็ก Proxy
              </Button>
              {proxyStatus === 'valid' && (
                <Alert severity="success" sx={{ py: 0 }}>Proxy ใช้งานได้</Alert>
              )}
              {proxyStatus === 'invalid' && (
                <Alert severity="error" sx={{ py: 0 }}>
                  {proxyErrorMessage || 'Proxy ใช้งานไม่ได้'}
                </Alert>
              )}
            </Box>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.autoLogout}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, autoLogout: e.target.checked }))
                }
                disabled={loading}
                color="primary"
              />
            }
            label="Logout อัตโนมัติหลังกระบวนการ"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.name.trim() || !formData.phoneNumber.trim() || !formData.password.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 