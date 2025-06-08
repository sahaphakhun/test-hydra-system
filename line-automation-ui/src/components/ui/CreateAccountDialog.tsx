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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Close } from '@mui/icons-material';
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
    autoLogout: true,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof CreateAccountData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phoneNumber.trim() || !formData.password.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', phoneNumber: '', password: '', autoLogout: true });
      onClose();
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', phoneNumber: '', password: '', autoLogout: true });
      onClose();
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