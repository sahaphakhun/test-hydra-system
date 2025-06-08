"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Check } from "@mui/icons-material";
import api from "@/lib/api";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface Job {
  _id: string;
  type: string;
  accountId?: string;
  status: string;
  createdAt: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/admin/jobs");
      setJobs(res.data);
    } catch {
      setMessage("โหลดข้อมูลล้มเหลว");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/jobs/${id}/status`, { status });
      setMessage("อัปเดตสำเร็จ");
      fetchJobs();
    } catch {
      setMessage("อัปเดตล้มเหลว");
    }
  };

  const { addMessageListener } = useWebSocket();

  useEffect(() => {
    fetchJobs();
    const unsubscribe = addMessageListener((d) => {
      if (d.type === "STATUS_UPDATE" && d.payload?.jobId) fetchJobs();
    });
    return unsubscribe;
  }, [addMessageListener]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        รายการงาน
      </Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>ประเภท</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>เมื่อ</TableCell>
              <TableCell>เปลี่ยนสถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job._id} hover>
                <TableCell>{job._id.slice(-6)}</TableCell>
                <TableCell>{job.type}</TableCell>
                <TableCell>
                  <Chip label={job.status} size="small" />
                </TableCell>
                <TableCell>
                  {new Date(job.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() =>
                      updateStatus(
                        job._id,
                        job.status === "completed" ? "failed" : "completed"
                      )
                    }
                  >
                    <Check />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
