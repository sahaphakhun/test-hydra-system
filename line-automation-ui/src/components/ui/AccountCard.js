"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const react_1 = require("react");
function AccountCard({ account, onEdit, onDelete, onEnterOtp, onRetry }) {
    const [anchorEl, setAnchorEl] = (0, react_1.useState)(null);
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'success':
                return 'success';
            case 'pending':
            case 'awaitingOtp':
            case 'timeout':
            case 'inactive':
                return 'warning';
            default:
                return 'warning';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'active':
            case 'success':
                return 'ใช้งานได้';
            case 'pending':
            case 'inactive':
                return 'กำลังดำเนินการ';
            case 'awaitingOtp':
                return 'รอ OTP';
            case 'timeout':
                return 'หมดเวลา OTP';
            case 'error':
                return 'ผิดพลาด';
            default:
                return 'กำลังดำเนินการ';
        }
    };
    return (<material_1.Card sx={{ height: '100%', position: 'relative' }}>
      <material_1.CardContent>
        <material_1.Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <material_1.Typography variant="h6" component="h3" fontWeight={600}>
            {account.name}
          </material_1.Typography>
          <material_1.IconButton size="small" onClick={handleMenuOpen}>
            <icons_material_1.MoreVert />
          </material_1.IconButton>
        </material_1.Box>

        <material_1.Typography variant="body2" color="text.secondary" mb={1}>
          {account.phoneNumber}
        </material_1.Typography>

        <material_1.Box display="flex" alignItems="center" gap={1} mb={2}>
          <icons_material_1.Circle sx={{ fontSize: 8, color: getStatusColor(account.status) === 'success' ? 'success.main' : getStatusColor(account.status) === 'warning' ? 'warning.main' : 'error.main' }}/>
          <material_1.Chip label={getStatusText(account.status)} color={getStatusColor(account.status)} size="small" variant="outlined"/>
        </material_1.Box>

        {account.proxy && (<material_1.Typography variant="caption" color="text.secondary">
            Proxy: {account.proxy.split('@')[1] || account.proxy}
          </material_1.Typography>)}

        <material_1.Typography variant="caption" display="block" color="text.secondary" mt={1}>
          สร้างเมื่อ: {new Date(account.createdAt).toLocaleDateString('th-TH')}
        </material_1.Typography>

        {/* ปุ่มสำหรับกรอก OTP เฉพาะเมื่อสถานะรอ OTP */}
        {account.status === 'awaitingOtp' && (<material_1.Box mt={2}>
            <material_1.Button variant="outlined" size="small" onClick={() => onEnterOtp === null || onEnterOtp === void 0 ? void 0 : onEnterOtp(account)}>
              กรอก OTP
            </material_1.Button>
          </material_1.Box>)}
      </material_1.CardContent>

      <material_1.Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <material_1.MenuItem onClick={() => { onEdit === null || onEdit === void 0 ? void 0 : onEdit(account); handleMenuClose(); }}>
          แก้ไข
        </material_1.MenuItem>
        <material_1.MenuItem onClick={() => { onDelete === null || onDelete === void 0 ? void 0 : onDelete(account.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          ลบ
        </material_1.MenuItem>
        {(account.status === 'error' || account.status === 'timeout') && (<material_1.MenuItem onClick={() => { onRetry === null || onRetry === void 0 ? void 0 : onRetry(account); handleMenuClose(); }}>
            ลองสมัครใหม่
          </material_1.MenuItem>)}
      </material_1.Menu>
    </material_1.Card>);
}
exports.default = AccountCard;
