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
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RegistrationRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<RegistrationRequest["status"] | "">("");
  const [actualDisplayName, setActualDisplayName] = useState("");
  const [actualPassword, setActualPassword] = useState("");
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, []);

  const { addMessageListener } = useWebSocket();

  // websocket real-time
  useEffect(() => {
    const unsubscribe = addMessageListener((data) => {
      if (
        data.type === "STATUS_UPDATE" ||
        (data.type === "statusUpdate" && (data.phoneNumber || data.details?.requestId))
      ) {
        fetchRequests();
      }
    });
    return unsubscribe;
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
      fetchRequests();
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
      fetchRequests();
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
      fetchRequests();
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
          <IconButton onClick={fetchRequests} disabled={refreshing}>
            {refreshing ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
        </Tooltip>
        <Box flex={1} />
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
      </Stack>
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