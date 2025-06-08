"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const material_1 = require("@mui/material");
const react_1 = require("react");
function OtpDialog({ open, phoneNumber, startTime, timeoutMs = 5 * 60 * 1000, onSubmit, onClose }) {
    const [otp, setOtp] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [remaining, setRemaining] = (0, react_1.useState)(timeoutMs);
    // countdown timer
    (0, react_1.useEffect)(() => {
        if (!open)
            return;
        // คำนวณเวลาที่เหลือจาก startTime หากมี
        const now = Date.now();
        const initialRemaining = startTime ? Math.max(timeoutMs - (now - startTime), 0) : timeoutMs;
        setRemaining(initialRemaining);
        const interval = setInterval(() => {
            setRemaining((prev) => (prev <= 1000 ? 0 : prev - 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [open, startTime, timeoutMs]);
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        if (!otp.trim())
            return;
        setLoading(true);
        try {
            yield onSubmit(otp.trim());
            setOtp('');
        }
        finally {
            setLoading(false);
        }
    });
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return (<material_1.Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <material_1.DialogTitle>กรอก OTP สำหรับ {phoneNumber}</material_1.DialogTitle>
      <material_1.DialogContent>
        <material_1.Box display="flex" flexDirection="column" gap={2} mt={1}>
          <material_1.TextField label="OTP 6 หลัก" value={otp} onChange={(e) => setOtp(e.target.value)} inputProps={{ maxLength: 6 }} disabled={loading} autoFocus/>
          <material_1.Typography variant="body2" color="text.secondary">
            เวลาที่เหลือ: {minutes}:{seconds.toString().padStart(2, '0')} นาที
          </material_1.Typography>
        </material_1.Box>
      </material_1.DialogContent>
      <material_1.DialogActions sx={{ p: 2 }}>
        <material_1.Button onClick={onClose} disabled={loading}>ยกเลิก</material_1.Button>
        <material_1.Button variant="contained" onClick={handleSubmit} disabled={loading || otp.length !== 6} startIcon={loading ? <material_1.CircularProgress size={20}/> : undefined}>ส่ง OTP</material_1.Button>
      </material_1.DialogActions>
    </material_1.Dialog>);
}
exports.default = OtpDialog;
