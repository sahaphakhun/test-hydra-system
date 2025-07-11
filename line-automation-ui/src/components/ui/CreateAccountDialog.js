"use strict";
'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const react_1 = require("react");
const api_1 = __importDefault(require("@/lib/api"));
function CreateAccountDialog({ open, onClose, onSubmit }) {
    var _a;
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        phoneNumber: '',
        password: '',
        proxy: '',
        autoLogout: true,
    });
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [proxyStatus, setProxyStatus] = (0, react_1.useState)('idle');
    const [proxyErrorMessage, setProxyErrorMessage] = (0, react_1.useState)('');
    const handleInputChange = (field) => (event) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [field]: event.target.value })));
        if (field === 'proxy') {
            setProxyStatus('idle');
        }
    };
    const checkProxy = () => __awaiter(this, void 0, void 0, function* () {
        var _b, _c, _d, _e;
        const proxy = (_b = formData.proxy) === null || _b === void 0 ? void 0 : _b.trim();
        if (!proxy)
            return;
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
        }
        catch (_f) {
            setProxyStatus('invalid');
            setProxyErrorMessage('รูปแบบ Proxy ไม่ถูกต้อง');
            return;
        }
        setProxyStatus('checking');
        try {
            // เรียก API เพื่อเช็ก proxy
            const response = yield api_1.default.post('/automation/check-proxy', { proxy });
            if (response.status === 200) {
                setProxyStatus('valid');
            }
            else {
                // กรณีที่ API ตอบกลับมา แต่ไม่ใช่ status 200
                setProxyStatus('invalid');
                setProxyErrorMessage(((_c = response.data) === null || _c === void 0 ? void 0 : _c.message) || 'ไม่สามารถใช้งาน Proxy นี้ได้');
            }
        }
        catch (error) {
            console.error('Check proxy failed:', error);
            setProxyStatus('invalid');
            // จัดการข้อความแสดงข้อผิดพลาด
            if (typeof error === 'object' && error !== null) {
                const errorObj = error;
                if ((_e = (_d = errorObj.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) {
                    setProxyErrorMessage(errorObj.response.data.message);
                }
                else if (errorObj.message) {
                    setProxyErrorMessage(`เกิดข้อผิดพลาด: ${errorObj.message}`);
                }
                else {
                    setProxyErrorMessage('ไม่สามารถเชื่อมต่อกับ API เพื่อตรวจสอบ Proxy');
                }
            }
            else {
                setProxyErrorMessage('ไม่สามารถเชื่อมต่อกับ API เพื่อตรวจสอบ Proxy');
            }
        }
    });
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        var _g;
        if (!formData.name.trim() || !formData.phoneNumber.trim() || !formData.password.trim()) {
            return;
        }
        setLoading(true);
        try {
            yield onSubmit(Object.assign(Object.assign({}, formData), { proxy: ((_g = formData.proxy) === null || _g === void 0 ? void 0 : _g.trim()) || undefined }));
            setFormData({ name: '', phoneNumber: '', password: '', proxy: '', autoLogout: true });
            setProxyStatus('idle');
            onClose();
        }
        catch (error) {
            console.error('Failed to create account:', error);
        }
        finally {
            setLoading(false);
        }
    });
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
                return <material_1.CircularProgress size={20}/>;
            case 'valid':
                return <icons_material_1.CheckCircle color="success"/>;
            case 'invalid':
                return <icons_material_1.Error color="error"/>;
            default:
                return null;
        }
    };
    return (<material_1.Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <material_1.DialogTitle>
        <material_1.Box display="flex" justifyContent="space-between" alignItems="center">
          <material_1.Typography variant="h6">เพิ่มบัญชี LINE ใหม่</material_1.Typography>
          <material_1.IconButton onClick={handleClose} disabled={loading}>
            <icons_material_1.Close />
          </material_1.IconButton>
        </material_1.Box>
      </material_1.DialogTitle>

      <material_1.DialogContent>
        <material_1.Stack spacing={3} sx={{ mt: 1 }}>
          <material_1.TextField label="ชื่อบัญชี" value={formData.name} onChange={handleInputChange('name')} fullWidth required disabled={loading}/>

          <material_1.TextField label="เบอร์โทรศัพท์" value={formData.phoneNumber} onChange={handleInputChange('phoneNumber')} fullWidth required disabled={loading} placeholder="0812345678"/>

          <material_1.TextField label="รหัสผ่าน" type="password" value={formData.password} onChange={handleInputChange('password')} fullWidth required disabled={loading}/>

          <material_1.Box>
            <material_1.TextField label="Proxy (ไม่บังคับ)" value={formData.proxy} onChange={handleInputChange('proxy')} fullWidth disabled={loading} placeholder="http://user:pass@host:port" InputProps={{
            endAdornment: getProxyIcon(),
        }}/>
            <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <material_1.Button size="small" onClick={checkProxy} disabled={!((_a = formData.proxy) === null || _a === void 0 ? void 0 : _a.trim()) || proxyStatus === 'checking' || loading}>
                เช็ก Proxy
              </material_1.Button>
              {proxyStatus === 'valid' && (<material_1.Alert severity="success" sx={{ py: 0 }}>Proxy ใช้งานได้</material_1.Alert>)}
              {proxyStatus === 'invalid' && (<material_1.Alert severity="error" sx={{ py: 0 }}>
                  {proxyErrorMessage || 'Proxy ใช้งานไม่ได้'}
                </material_1.Alert>)}
            </material_1.Box>
          </material_1.Box>
          <material_1.FormControlLabel control={<material_1.Switch checked={formData.autoLogout} onChange={(e) => setFormData(prev => (Object.assign(Object.assign({}, prev), { autoLogout: e.target.checked })))} disabled={loading} color="primary"/>} label="Logout อัตโนมัติหลังกระบวนการ"/>
        </material_1.Stack>
      </material_1.DialogContent>

      <material_1.DialogActions sx={{ p: 3 }}>
        <material_1.Button onClick={handleClose} disabled={loading}>
          ยกเลิก
        </material_1.Button>
        <material_1.Button variant="contained" onClick={handleSubmit} disabled={loading || !formData.name.trim() || !formData.phoneNumber.trim() || !formData.password.trim()} startIcon={loading ? <material_1.CircularProgress size={20}/> : undefined}>
          {loading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
        </material_1.Button>
      </material_1.DialogActions>
    </material_1.Dialog>);
}
exports.default = CreateAccountDialog;
