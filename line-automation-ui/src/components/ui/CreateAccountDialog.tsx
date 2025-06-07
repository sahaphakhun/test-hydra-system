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
} from '@mui/material';
import { Close, CheckCircle, Error } from '@mui/icons-material';
import { useState } from 'react';
import { CreateAccountData } from '@/types/account';

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
  });
  const [loading, setLoading] = useState(false);
  const [proxyStatus, setProxyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

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
    if (!formData.proxy?.trim()) return;
    
    setProxyStatus('checking');
    try {
      // จำลองการเช็ก proxy (ในความเป็นจริงจะเรียก API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProxyStatus('valid');
    } catch {
      setProxyStatus('invalid');
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
      setFormData({ name: '', phoneNumber: '', password: '', proxy: '' });
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
      setFormData({ name: '', phoneNumber: '', password: '', proxy: '' });
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
                <Alert severity="error" sx={{ py: 0 }}>Proxy ใช้งานไม่ได้</Alert>
              )}
            </Box>
          </Box>
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