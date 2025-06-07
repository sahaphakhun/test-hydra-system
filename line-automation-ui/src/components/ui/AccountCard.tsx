'use client';

import { Card, CardContent, Typography, Chip, Box, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert, Circle } from '@mui/icons-material';
import { useState } from 'react';
import { Account } from '@/types/account';

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (accountId: string) => void;
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
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
      case 'success':
        return 'success';
      case 'pending':
      case 'awaitingOtp':
      case 'timeout':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getStatusText = (status: Account['status']) => {
    switch (status) {
      case 'active':
      case 'success':
        return 'ใช้งานได้';
      case 'pending':
        return 'กำลังดำเนินการ';
      case 'awaitingOtp':
        return 'รอ OTP';
      case 'timeout':
        return 'หมดเวลา OTP';
      case 'error':
        return 'ผิดพลาด';
      default:
        return 'ไม่ได้ใช้งาน';
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
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit?.(account); handleMenuClose(); }}>
          แก้ไข
        </MenuItem>
        <MenuItem onClick={() => { onDelete?.(account.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          ลบ
        </MenuItem>
      </Menu>
    </Card>
  );
} 