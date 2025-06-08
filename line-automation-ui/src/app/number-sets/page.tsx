// 'use client' directive enables client-side React hooks
'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Stack,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Download,
  Phone,
} from '@mui/icons-material';
import type { NumberSet, InputType } from '@/types/numberSet';
import api from '@/lib/api';

export default function NumberSetsPage() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [inputType, setInputType] = useState<InputType>('manual');
  const [manualText, setManualText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [sets, setSets] = useState<NumberSet[]>([]);

  // Dialog states
  const [viewDialog, setViewDialog] = useState<{ open: boolean; set: NumberSet | null }>({ open: false, set: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; set: NumberSet | null }>({ open: false, set: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; set: NumberSet | null }>({ open: false, set: null });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await api.get('/phone-lists');
        const lists: NumberSet[] = res.data.map((l: any) => ({
          id: l._id,
          name: l.name,
          inputType: l.inputType,
          rawData: l.rawData,
          chunks: l.chunks,
          createdAt: l.createdAt,
        }));
        setSets(lists);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSets();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setFileName(f?.name || '');
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/phone-lists/${id}`);
      setSets(prev => prev.filter(s => s.id !== id));
      setMessage('ลบชุดเบอร์สำเร็จ');
      setMessageType('success');
      setDeleteDialog({ open: false, set: null });
    } catch (err) {
      console.error(err);
      setMessage('เกิดข้อผิดพลาดในการลบ');
      setMessageType('error');
    }
  };

  const handleDownload = (set: NumberSet) => {
    const numbers = set.chunks.flat().join('\n');
    const blob = new Blob([numbers], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${set.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!name.trim()) {
      setMessage('กรุณาระบุชื่อชุดเบอร์');
      setMessageType('error');
      return;
    }
    setLoading(true);
    let chunks: string[][] = [];
    try {
      if (inputType === 'manual') {
        const lines = manualText
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l);
        chunks = lines.map(line =>
          line
            .split(/[,\s]+/)
            .map(n => n.trim())
            .filter(n => n)
        );
      } else if (inputType === 'text') {
        if (!file) {
          setMessage('กรุณาเลือกไฟล์ .txt');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const text = await file.text();
        const lines = text
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l);
        chunks = lines.map(line =>
          line
            .split(/[,\s]+/)
            .map(n => n.trim())
            .filter(n => n)
        );
      } else if (inputType === 'vcf') {
        if (!file) {
          setMessage('กรุณาเลือกไฟล์ .vcf');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        const numbers = lines
          .filter(line => /^TEL[:;]/i.test(line))
          .map(line => line.split(':').pop()?.trim() || '')
          .filter(n => n);
        chunks = numbers.map(n => [n]);
      }
      if (chunks.length === 0) {
        setMessage('ไม่พบเบอร์ใดๆ');
        setMessageType('error');
        setLoading(false);
        return;
      }
      
      const payload = {
        name: name.trim(),
        inputType,
        rawData: inputType === 'manual' ? manualText : fileName,
        chunks,
      };
      
      console.log('📤 Sending payload:', payload);
      await api.post('/number-sets', payload);
      const res = await api.get('/phone-lists');
      const lists: NumberSet[] = res.data.map((l: any) => ({
        id: l._id,
        name: l.name,
        inputType: l.inputType,
        rawData: l.rawData,
        chunks: l.chunks,
        createdAt: l.createdAt,
      }));
      setSets(lists);
      setMessage('สร้างชุดเบอร์สำเร็จ');
      setMessageType('success');
      // clear form
      setName('');
      setManualText('');
      setFile(null);
      setFileName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error(error);
      setMessage('เกิดข้อผิดพลาด');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (set: NumberSet) => {
    setViewDialog({ open: true, set });
  };

  const handleEdit = (set: NumberSet) => {
    setEditDialog({ open: true, set });
  };

  const handleDeleteConfirm = (set: NumberSet) => {
    setDeleteDialog({ open: true, set });
  };

  const getInputTypeLabel = (type: InputType) => {
    switch (type) {
      case 'manual': return 'พิมพ์เอง';
      case 'text': return 'ไฟล์ Text';
      case 'vcf': return 'ไฟล์ VCF';
      default: return type;
    }
  };

  const getTotalNumbers = (chunks: string[][]) => {
    return chunks.flat().length;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          จัดการชุดเบอร์โทรศัพท์
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateForm(true)}
        >
          สร้างชุดเบอร์ใหม่
        </Button>
      </Box>

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>สร้างชุดเบอร์ใหม่</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="ชื่อชุดเบอร์"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>รูปแบบการเพิ่มเบอร์</InputLabel>
              <Select
                value={inputType}
                label="รูปแบบการเพิ่มเบอร์"
                onChange={e => setInputType(e.target.value as InputType)}
              >
                <MenuItem value="manual">แบบพิมข้อความเอง</MenuItem>
                <MenuItem value="text">แบบไฟล์ Text</MenuItem>
                <MenuItem value="vcf">แบบไฟล์ VCF</MenuItem>
              </Select>
            </FormControl>

            {inputType === 'manual' && (
              <TextField
                label="กรอกชุดเบอร์ (หนึ่งชุดต่อบรรทัด)"
                placeholder="0812345678,0912345678"
                multiline
                rows={6}
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                fullWidth
              />
            )}

            {(inputType === 'text' || inputType === 'vcf') && (
              <Button variant="outlined" component="label">
                เลือกไฟล์ {inputType === 'text' ? '.txt' : '.vcf'}
                <input
                  type="file"
                  hidden
                  accept={inputType === 'text' ? '.txt' : '.vcf'}
                  onChange={handleFileChange}
                />
              </Button>
            )}
            {fileName && (
              <Typography variant="body2">ไฟล์: {fileName}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateForm(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'สร้าง'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ชื่อชุดเบอร์</TableCell>
              <TableCell>ประเภท</TableCell>
              <TableCell>จำนวนเบอร์</TableCell>
              <TableCell>วันที่สร้าง</TableCell>
              <TableCell align="center">การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    ยังไม่มีชุดเบอร์โทรศัพท์
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sets.map((set) => (
                <TableRow key={set.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{set.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getInputTypeLabel(set.inputType)} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone fontSize="small" color="action" />
                      <Typography>{getTotalNumbers(set.chunks)} เบอร์</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(set.createdAt).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="ดูรายละเอียด">
                      <IconButton size="small" onClick={() => handleView(set)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="แก้ไข">
                      <IconButton size="small" onClick={() => handleEdit(set)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ดาวน์โหลด">
                      <IconButton size="small" onClick={() => handleDownload(set)}>
                        <Download />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(set)}>
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

      {/* View Dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, set: null })} maxWidth="md" fullWidth>
        <DialogTitle>รายละเอียดชุดเบอร์: {viewDialog.set?.name}</DialogTitle>
        <DialogContent>
          {viewDialog.set && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>ข้อมูลทั่วไป</Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Typography><strong>ชื่อ:</strong> {viewDialog.set.name}</Typography>
                    <Typography><strong>ประเภท:</strong> {getInputTypeLabel(viewDialog.set.inputType)}</Typography>
                    <Typography><strong>จำนวนเบอร์:</strong> {getTotalNumbers(viewDialog.set.chunks)} เบอร์</Typography>
                    <Typography><strong>วันที่สร้าง:</strong> {new Date(viewDialog.set.createdAt).toLocaleString('th-TH')}</Typography>
                  </CardContent>
                </Card>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>รายการเบอร์โทรศัพท์</Typography>
                <Card variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <CardContent>
                    {viewDialog.set.chunks.map((chunk, index) => (
                      <Box key={index} mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          ชุดที่ {index + 1}: {chunk.join(', ')}
                        </Typography>
                        {index < viewDialog.set.chunks.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, set: null })}>ปิด</Button>
          {viewDialog.set && (
            <Button variant="contained" onClick={() => handleDownload(viewDialog.set!)}>
              ดาวน์โหลด
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, set: null })} maxWidth="sm" fullWidth>
        <DialogTitle>แก้ไขชุดเบอร์: {editDialog.set?.name}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            ฟีเจอร์แก้ไขจะพัฒนาในอนาคต
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, set: null })}>ปิด</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, set: null })}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบชุดเบอร์ "{deleteDialog.set?.name}" หรือไม่?
          </Typography>
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            การดำเนินการนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, set: null })}>ยกเลิก</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => deleteDialog.set && handleDelete(deleteDialog.set.id)}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setMessage(null)}
      >
        <Alert
          severity={messageType}
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 