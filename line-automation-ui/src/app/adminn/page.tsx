"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  ChipProps,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  InputAdornment,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import { Visibility, Delete, CheckCircle, Refresh, Search } from "@mui/icons-material";
import api from "@/lib/api";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface RegistrationRequest {
  _id: string;
  phoneNumber: string;
  displayName: string;
  password: string;
  proxy?: string;
  autoLogout: boolean;
  status: "pending" | "processing" | "awaiting_otp" | "completed" | "failed";
  requestedAt: string;
  completedAt?: string;
  otpRequested: boolean;
  otpRequestedAt?: string;
  adminNotes?: string;
}

interface LineAccount {
  _id: string;
  displayName: string;
  userId: string;
  phoneNumber?: string;
  email?: string;
  pictureUrl?: string;
  statusMessage?: string;
  tags: string[];
  isBlocked: boolean;
  lastInteraction: string;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  _id: string;
  type: string;
  accountId?: string;
  data: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอดำเนินการ" },
  { value: "processing", label: "กำลังดำเนินการ" },
  { value: "awaiting_otp", label: "รอ OTP" },
  { value: "completed", label: "เสร็จสมบูรณ์" },
  { value: "failed", label: "ล้มเหลว" },
];

export default function AdminPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [accounts, setAccounts] = useState<LineAccount[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selected, setSelected] = useState<RegistrationRequest | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<RegistrationRequest["status"] | "">("");
  const [editJobStatus, setEditJobStatus] = useState<Job["status"] | "">("");
  const [actualDisplayName, setActualDisplayName] = useState("");
  const [actualPassword, setActualPassword] = useState("");
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState<"requests" | "accounts" | "jobs">("requests");

  // โหลดข้อมูล
  const fetchRequests = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/admin/registration-requests");
      setRequests(res.data);
    } catch {
      setMessage("โหลดข้อมูลล้มเหลว");
      setMessageType("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    try {
      const res = await api.get("/accounts");
      setAccounts(res.data);
    } catch {
      setMessage("โหลดข้อมูลบัญชีล้มเหลว");
      setMessageType("error");
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch {
      setMessage("โหลดข้อมูลงานล้มเหลว");
      setMessageType("error");
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchRequests(), fetchAccounts(), fetchJobs()]);
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line
  }, []);

  const { addMessageListener } = useWebSocket();

  // websocket real-time
  useEffect(() => {
    try {
      const unsubscribe = addMessageListener((data) => {
        if (
          data.type === "STATUS_UPDATE" ||
          (data.type === "statusUpdate" && (data.phoneNumber || data.details?.requestId))
        ) {
          fetchAllData();
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Failed to setup WebSocket listener:', error);
      // ถ้า WebSocket ไม่ทำงาน ให้ใช้ polling แทน
      const interval = setInterval(fetchAllData, 30000); // refresh ทุก 30 วินาที
      return () => clearInterval(interval);
    }
  }, [addMessageListener]);

  // ฟิลเตอร์/ค้นหา
  const filtered = useMemo(() => {
    let list = requests;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.phoneNumber.includes(s) ||
          r.displayName.toLowerCase().includes(s) ||
          (r.adminNotes && r.adminNotes.toLowerCase().includes(s))
      );
    }
    return list;
  }, [requests, search, statusFilter]);

  // เปิด dialog รายละเอียด
  const handleOpenDetail = (req: RegistrationRequest) => {
    setSelected(req);
    setEditNotes(req.adminNotes || "");
    setEditStatus(req.status);
    setActualDisplayName(req.displayName);
    setActualPassword(req.password);
    setDetailOpen(true);
  };

  // อัปเดตสถานะ/โน้ต
  const handleUpdate = async () => {
    if (!selected) return;
    try {
      await api.put(`/admin/registration-requests/${selected._id}/status`, {
        status: editStatus,
        adminNotes: editNotes,
      });
      setMessage("อัปเดตสำเร็จ");
      setMessageType("success");
      setDetailOpen(false);
      fetchAllData();
    } catch {
      setMessage("อัปเดตล้มเหลว");
      setMessageType("error");
    }
  };

  // สร้างบัญชี
  const handleCreateAccount = async () => {
    if (!selected) return;
    setCreateAccountLoading(true);
    try {
      await api.post(`/admin/registration-requests/${selected._id}/create-account`, {
        actualDisplayName,
        actualPassword,
      });
      setMessage("สร้างบัญชีสำเร็จ");
      setMessageType("success");
      setDetailOpen(false);
      fetchAllData();
    } catch {
      setMessage("สร้างบัญชีล้มเหลว");
      setMessageType("error");
    } finally {
      setCreateAccountLoading(false);
    }
  };

  // ลบคำขอ
  const handleDelete = async (id: string) => {
    if (!window.confirm("ยืนยันการลบคำขอนี้?")) return;
    try {
      await api.delete(`/admin/registration-requests/${id}`);
      setMessage("ลบสำเร็จ");
      setMessageType("success");
      fetchAllData();
    } catch {
      setMessage("ลบล้มเหลว");
      setMessageType("error");
    }
  };

  // สีสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "processing":
        return "info";
      case "awaiting_otp":
        return "secondary";
      case "completed":
        return "success";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  // ชื่อสถานะ
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "รอดำเนินการ";
      case "processing":
        return "กำลังดำเนินการ";
      case "awaiting_otp":
        return "รอ OTP";
      case "completed":
        return "เสร็จสมบูรณ์";
      case "failed":
        return "ล้มเหลว";
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h4">แดชบอร์ดแอดมิน</Typography>
        <Tooltip title="รีเฟรชข้อมูล">
          <IconButton onClick={fetchAllData} disabled={refreshing}>
            {refreshing ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
        </Tooltip>
        <Box flex={1} />
        {currentTab === "requests" && (
          <>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={statusFilter}
                label="สถานะ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </>
        )}
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab 
            label={
              <Badge badgeContent={requests.length} color="primary">
                คำขอลงทะเบียน
              </Badge>
            } 
            value="requests" 
          />
          <Tab 
            label={
              <Badge badgeContent={accounts.length} color="success">
                บัญชีที่ใช้งานได้
              </Badge>
            } 
            value="accounts" 
          />
          <Tab 
            label={
              <Badge badgeContent={jobs.length} color="info">
                งานที่ดำเนินการ
              </Badge>
            } 
            value="jobs" 
          />
        </Tabs>
      </Box>

      {/* Registration Requests Table */}
      {currentTab === "requests" && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>เบอร์โทรศัพท์</TableCell>
                <TableCell>ชื่อ</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>วันที่ขอ</TableCell>
                <TableCell>OTP</TableCell>
                <TableCell>หมายเหตุ</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((req) => (
                  <TableRow key={req._id} hover>
                    <TableCell>{req.phoneNumber}</TableCell>
                    <TableCell>{req.displayName}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(req.status)}
                        color={getStatusColor(req.status) as ChipProps["color"]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(req.requestedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {req.otpRequested ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {req.adminNotes ? (
                        <Tooltip title={req.adminNotes}>
                          <span>{req.adminNotes.slice(0, 16)}{req.adminNotes.length > 16 ? "..." : ""}</span>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="ดูรายละเอียด">
                        <IconButton onClick={() => handleOpenDetail(req)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบคำขอ">
                        <IconButton color="error" onClick={() => handleDelete(req._id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Accounts Table */}
      {currentTab === "accounts" && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ชื่อแสดง</TableCell>
                <TableCell>เบอร์โทรศัพท์</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>อีเมล</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>วันที่สร้าง</TableCell>
                <TableCell>การโต้ตอบล่าสุด</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accountsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    ไม่พบบัญชี
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {account.pictureUrl && (
                          <img 
                            src={account.pictureUrl} 
                            alt={account.displayName}
                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                          />
                        )}
                        <Typography variant="body2">{account.displayName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{account.phoneNumber || "-"}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {account.userId}
                      </Typography>
                    </TableCell>
                    <TableCell>{account.email || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={account.isBlocked ? "ถูกบล็อก" : "ใช้งานได้"}
                        color={account.isBlocked ? "error" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(account.createdAt).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      {new Date(account.lastInteraction).toLocaleDateString('th-TH')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Jobs Table */}
      {currentTab === "jobs" && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ชื่องาน</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>วันที่สร้าง</TableCell>
                <TableCell>การโต้ตอบล่าสุด</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    ไม่พบงาน
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job._id} hover>
                    <TableCell>{job.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(job.status)}
                        color={getStatusColor(job.status) as ChipProps["color"]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(job.createdAt).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      {new Date(job.updatedAt).toLocaleDateString('th-TH')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog รายละเอียด */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>รายละเอียดคำขอลงทะเบียน</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2">เบอร์โทรศัพท์</Typography>
                <Typography>{selected.phoneNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">ชื่อ</Typography>
                <Typography>{selected.displayName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">รหัสผ่าน</Typography>
                <Typography>{selected.password}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Proxy</Typography>
                <Typography>{selected.proxy || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">สถานะ</Typography>
                <Chip
                  label={getStatusText(selected.status)}
                  color={getStatusColor(selected.status) as ChipProps["color"]}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="subtitle2">หมายเหตุแอดมิน</Typography>
                <TextField
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2">อัปเดตสถานะ</Typography>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as RegistrationRequest["status"])}
                  fullWidth
                >
                  {statusOptions
                    .filter((opt) => opt.value !== "all")
                    .map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                </Select>
              </Box>
              <Box>
                <Typography variant="subtitle2">วันที่ขอ</Typography>
                <Typography>{new Date(selected.requestedAt).toLocaleString()}</Typography>
              </Box>
              {selected.completedAt && (
                <Box>
                  <Typography variant="subtitle2">วันที่เสร็จ</Typography>
                  <Typography>{new Date(selected.completedAt).toLocaleString()}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>ปิด</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">
            อัปเดตสถานะ/หมายเหตุ
          </Button>
          <Button
            onClick={handleCreateAccount}
            variant="contained"
            color="success"
            disabled={createAccountLoading}
          >
            {createAccountLoading ? <CircularProgress size={20} /> : "สร้างบัญชี"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar แจ้งเตือน */}
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={messageType} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 