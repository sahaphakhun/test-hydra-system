import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';

interface OtpDialogProps {
  open: boolean;
  phoneNumber: string;
  startTime?: number; // timestamp เมื่อ backend ส่ง awaitingOtp
  timeoutMs?: number; // default 5 min
  onSubmit: (otp: string) => Promise<void>;
  onClose: () => void;
}

export default function OtpDialog({ open, phoneNumber, startTime, timeoutMs = 5 * 60 * 1000, onSubmit, onClose }: OtpDialogProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(timeoutMs);

  // countdown timer
  useEffect(() => {
    if (!open) return;
    // คำนวณเวลาที่เหลือจาก startTime หากมี
    const now = Date.now();
    const initialRemaining = startTime ? Math.max(timeoutMs - (now - startTime), 0) : timeoutMs;
    setRemaining(initialRemaining);
    const interval = setInterval(() => {
      setRemaining((prev) => (prev <= 1000 ? 0 : prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, startTime, timeoutMs]);

  const handleSubmit = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    try {
      await onSubmit(otp.trim());
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>กรอก OTP สำหรับ {phoneNumber}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="OTP 6 หลัก"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputProps={{ maxLength: 6 }}
            disabled={loading}
            autoFocus
          />
          <Typography variant="body2" color="text.secondary">
            เวลาที่เหลือ: {minutes}:{seconds.toString().padStart(2, '0')} นาที
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || otp.length !== 6}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >ส่ง OTP</Button>
      </DialogActions>
    </Dialog>
  );
} 