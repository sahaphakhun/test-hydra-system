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
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const api_1 = __importDefault(require("@/lib/api"));
function AdminPage() {
    const [registrations, setRegistrations] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)(null);
    const [messageType, setMessageType] = (0, react_1.useState)('success');
    const [showPasswords, setShowPasswords] = (0, react_1.useState)({});
    // โหลดข้อมูลการลงทะเบียนที่รอดำเนินการ
    const loadPendingRegistrations = () => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        try {
            const response = yield api_1.default.get('/automation/pending-registrations');
            setRegistrations(response.data.registrations || []);
        }
        catch (error) {
            console.error('Failed to load pending registrations:', error);
            setMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            setMessageType('error');
        }
        finally {
            setLoading(false);
        }
    });
    // โหลดข้อมูลเมื่อเริ่มต้น
    (0, react_1.useEffect)(() => {
        loadPendingRegistrations();
    }, []);
    // รีเฟรชข้อมูลทุก 30 วินาที
    (0, react_1.useEffect)(() => {
        const interval = setInterval(loadPendingRegistrations, 30000);
        return () => clearInterval(interval);
    }, []);
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'waiting_otp':
                return 'info';
            case 'completed':
                return 'success';
            case 'failed':
                return 'error';
            default:
                return 'default';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'รอดำเนินการ';
            case 'waiting_otp':
                return 'รอ OTP';
            case 'completed':
                return 'เสร็จสิ้น';
            case 'failed':
                return 'ล้มเหลว';
            default:
                return status;
        }
    };
    const togglePasswordVisibility = (phoneNumber) => {
        setShowPasswords(prev => (Object.assign(Object.assign({}, prev), { [phoneNumber]: !prev[phoneNumber] })));
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('th-TH');
    };
    return (<material_1.Container maxWidth="xl" sx={{ py: 4 }}>
      <material_1.Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <material_1.Box>
          <material_1.Typography variant="h4" component="h1" gutterBottom>
            แอดมิน - ข้อมูลการลงทะเบียน
          </material_1.Typography>
          <material_1.Typography variant="body1" color="text.secondary">
            ดูข้อมูลการลงทะเบียนบัญชี LINE ที่รอดำเนินการ
          </material_1.Typography>
        </material_1.Box>
        <material_1.Button variant="outlined" startIcon={<icons_material_1.Refresh />} onClick={loadPendingRegistrations} disabled={loading}>
          รีเฟรช
        </material_1.Button>
      </material_1.Box>

      {/* สถิติรวม */}
      <material_1.Grid container spacing={3} mb={4}>
        <material_1.Grid item xs={12} sm={6} md={3}>
          <material_1.Card>
            <material_1.CardContent>
              <material_1.Typography variant="h6" color="warning.main">
                รอดำเนินการ
              </material_1.Typography>
              <material_1.Typography variant="h4">
                {registrations.filter(r => r.status === 'pending').length}
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        <material_1.Grid item xs={12} sm={6} md={3}>
          <material_1.Card>
            <material_1.CardContent>
              <material_1.Typography variant="h6" color="info.main">
                รอ OTP
              </material_1.Typography>
              <material_1.Typography variant="h4">
                {registrations.filter(r => r.status === 'waiting_otp').length}
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        <material_1.Grid item xs={12} sm={6} md={3}>
          <material_1.Card>
            <material_1.CardContent>
              <material_1.Typography variant="h6" color="success.main">
                เสร็จสิ้น
              </material_1.Typography>
              <material_1.Typography variant="h4">
                {registrations.filter(r => r.status === 'completed').length}
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        <material_1.Grid item xs={12} sm={6} md={3}>
          <material_1.Card>
            <material_1.CardContent>
              <material_1.Typography variant="h6" color="error.main">
                ล้มเหลว
              </material_1.Typography>
              <material_1.Typography variant="h4">
                {registrations.filter(r => r.status === 'failed').length}
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
      </material_1.Grid>

      {/* ตารางข้อมูล */}
      <material_1.Card>
        <material_1.CardContent>
          <material_1.Typography variant="h6" gutterBottom>
            รายการการลงทะเบียน ({registrations.length} รายการ)
          </material_1.Typography>
          
          {registrations.length === 0 ? (<material_1.Box textAlign="center" py={4}>
              <material_1.Typography variant="body1" color="text.secondary">
                ไม่มีข้อมูลการลงทะเบียนที่รอดำเนินการ
              </material_1.Typography>
            </material_1.Box>) : (<material_1.TableContainer component={material_1.Paper} variant="outlined">
              <material_1.Table>
                <material_1.TableHead>
                  <material_1.TableRow>
                    <material_1.TableCell>เบอร์โทรศัพท์</material_1.TableCell>
                    <material_1.TableCell>ชื่อที่แสดง</material_1.TableCell>
                    <material_1.TableCell>รหัสผ่าน</material_1.TableCell>
                    <material_1.TableCell>Proxy</material_1.TableCell>
                    <material_1.TableCell>สถานะ</material_1.TableCell>
                    <material_1.TableCell>ขอ OTP แล้ว</material_1.TableCell>
                    <material_1.TableCell>วันที่สร้าง</material_1.TableCell>
                  </material_1.TableRow>
                </material_1.TableHead>
                <material_1.TableBody>
                  {registrations.map((registration) => (<material_1.TableRow key={registration.phoneNumber}>
                      <material_1.TableCell>
                        <material_1.Typography variant="body2" fontWeight="medium">
                          {registration.phoneNumber}
                        </material_1.Typography>
                      </material_1.TableCell>
                      <material_1.TableCell>{registration.displayName}</material_1.TableCell>
                      <material_1.TableCell>
                        <material_1.Box display="flex" alignItems="center" gap={1}>
                          <material_1.Typography variant="body2" fontFamily="monospace">
                            {showPasswords[registration.phoneNumber]
                    ? registration.password
                    : '••••••••'}
                          </material_1.Typography>
                          <material_1.Tooltip title={showPasswords[registration.phoneNumber] ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
                            <material_1.IconButton size="small" onClick={() => togglePasswordVisibility(registration.phoneNumber)}>
                              {showPasswords[registration.phoneNumber] ? <icons_material_1.VisibilityOff /> : <icons_material_1.Visibility />}
                            </material_1.IconButton>
                          </material_1.Tooltip>
                        </material_1.Box>
                      </material_1.TableCell>
                      <material_1.TableCell>
                        {registration.proxy ? (<material_1.Typography variant="body2" fontFamily="monospace">
                            {registration.proxy}
                          </material_1.Typography>) : (<material_1.Typography variant="body2" color="text.secondary">
                            ไม่มี
                          </material_1.Typography>)}
                      </material_1.TableCell>
                      <material_1.TableCell>
                        <material_1.Chip label={getStatusText(registration.status)} color={getStatusColor(registration.status)} size="small"/>
                      </material_1.TableCell>
                      <material_1.TableCell>
                        <material_1.Chip label={registration.otpRequested ? 'ขอแล้ว' : 'ยังไม่ขอ'} color={registration.otpRequested ? 'success' : 'default'} size="small" variant="outlined"/>
                      </material_1.TableCell>
                      <material_1.TableCell>
                        <material_1.Typography variant="body2">
                          {formatDate(registration.createdAt)}
                        </material_1.Typography>
                      </material_1.TableCell>
                    </material_1.TableRow>))}
                </material_1.TableBody>
              </material_1.Table>
            </material_1.TableContainer>)}
        </material_1.CardContent>
      </material_1.Card>

      {/* Snackbar for messages */}
      <material_1.Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <material_1.Alert severity={messageType} onClose={() => setMessage(null)}>
          {message}
        </material_1.Alert>
      </material_1.Snackbar>
    </material_1.Container>);
}
exports.default = AdminPage;
