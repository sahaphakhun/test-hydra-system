'use client';

import { Card, CardContent, Typography, Chip, Box, IconButton, Menu, MenuItem, Button, Divider } from '@mui/material';
import { MoreVert, Circle, Edit, Delete, Refresh, Sms, PhoneAndroid } from '@mui/icons-material';
import { useState } from 'react';
import { Account } from '@/types/account';

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (accountId: string) => void;
  /**
   * เปิด dialog เพื่อกรอก OTP สำหรับบัญชีนี้
   */
  onEnterOtp?: (account: Account) => void;
  /**
   * ขอ OTP สำหรับบัญชีนี้
   */
  onRequestOtp?: (phoneNumber: string) => void;
  /**
   * ลองสมัครใหม่เมื่อเกิดข้อผิดพลาดหรือหมดเวลา OTP
   */
  onRetry?: (account: Account) => void;
}

export default function AccountCard({ account, onEdit, onDelete, onEnterOtp, onRequestOtp, onRetry }: AccountCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: Account['status']) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'active':
        return 'success';
      case 'pending':
      case 'awaiting_otp':
      case 'timeout':
      case 'inactive':
        return 'warning';
      default:
        return 'warning';
    }
  };

  const getStatusText = (status: Account['status']) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'ใช้งานได้';
      case 'pending':
      case 'inactive':
        return 'กำลังดำเนินการ';
      case 'awaiting_otp':
        return 'รอ OTP';
      case 'timeout':
        return 'หมดเวลา OTP';
      case 'failed':
        return 'ผิดพลาด';
      default:
        return 'กำลังดำเนินการ';
    }
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h3" fontWeight={600}>
            {account.name}
          </Typography>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={1}>
          {account.phoneNumber}
          {account.isFromRequest && (
            <Chip 
              label="รอดำเนินการ" 
              size="small" 
              variant="outlined" 
              color="info"
              sx={{ ml: 1, fontSize: '0.7rem', height: '20px' }}
            />
          )}
        </Typography>

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Circle sx={{ fontSize: 8, color: getStatusColor(account.status) === 'success' ? 'success.main' : getStatusColor(account.status) === 'warning' ? 'warning.main' : 'error.main' }} />
          <Chip
            label={getStatusText(account.status)}
            color={getStatusColor(account.status)}
            size="small"
            variant="outlined"
          />
        </Box>

        {account.proxy && (
          <Typography variant="caption" color="text.secondary">
            Proxy: {account.proxy.split('@')[1] || account.proxy}
          </Typography>
        )}

        <Typography variant="caption" display="block" color="text.secondary" mt={1}>
          สร้างเมื่อ: {new Date(account.createdAt).toLocaleDateString('th-TH')}
        </Typography>

        {/* ปุ่มสำหรับกรอก OTP เฉพาะเมื่อสถานะรอ OTP */}
        {account.status === 'awaiting_otp' && (
          <Box mt={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onEnterOtp?.(account)}
            >
              กรอก OTP
            </Button>
          </Box>
        )}
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit?.(account); handleMenuClose(); }}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          แก้ไข
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onRequestOtp?.(account.phoneNumber); handleMenuClose(); }}>
          <PhoneAndroid sx={{ mr: 1, fontSize: 20 }} />
          ขอ OTP
        </MenuItem>
        <MenuItem onClick={() => { onEnterOtp?.(account); handleMenuClose(); }}>
          <Sms sx={{ mr: 1, fontSize: 20 }} />
          กรอก OTP
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onDelete?.(account.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          ลบ
        </MenuItem>
        {(account.status === 'failed' || account.status === 'timeout') && (
          <MenuItem onClick={() => { onRetry?.(account); handleMenuClose(); }}>
            <Refresh sx={{ mr: 1, fontSize: 20 }} />
            ลองสมัครใหม่
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
} 