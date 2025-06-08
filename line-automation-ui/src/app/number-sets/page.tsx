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
} from '@mui/material';
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
    } catch (err) {
      console.error(err);
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
      const newId = Date.now().toString() + Math.random().toString(36).slice(2);
      const newSet: NumberSet = {
        id: newId,
        name: name.trim(),
        inputType,
        rawData: inputType === 'manual' ? manualText : fileName,
        chunks,
        createdAt: new Date().toISOString(),
      };
      await api.post('/number-sets', newSet);
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
    } catch (error) {
      console.error(error);
      setMessage('เกิดข้อผิดพลาด');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        สร้างชุดเบอร์
      </Typography>
      <Stack spacing={2}>
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

        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'ดำเนินการต่อ'}
        </Button>
      </Stack>

      {sets.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            รายการชุดเบอร์
          </Typography>
          {sets.map(set => (
            <Box key={set.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography>{set.name}</Typography>
              <Box>
                <Button size="small" onClick={() => handleDownload(set)}>ดาวน์โหลด</Button>
                <Button size="small" color="error" onClick={() => handleDelete(set.id)}>ลบ</Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

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