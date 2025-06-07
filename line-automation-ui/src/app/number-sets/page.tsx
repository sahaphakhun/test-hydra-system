import { useState } from 'react';
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
  const [groupSize, setGroupSize] = useState(100);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setFileName(f?.name || '');
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!name.trim()) {
      setMessage('กรุณาระบุชื่อชุดเบอร์');
      setMessageType('error');
      return;
    }
    setLoading(true);
    let numbers: string[] = [];
    try {
      if (inputType === 'manual') {
        numbers = manualText
          .split(/\r?\n/)
          .map(n => n.trim())
          .filter(n => n);
      } else if (inputType === 'text') {
        if (!file) {
          setMessage('กรุณาเลือกไฟล์ .txt');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const text = await file.text();
        numbers = text
          .split(/\r?\n/)
          .map(n => n.trim())
          .filter(n => n);
      } else if (inputType === 'vcf') {
        if (!file) {
          setMessage('กรุณาเลือกไฟล์ .vcf');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        numbers = lines
          .filter(line => /^TEL[:;]/i.test(line))
          .map(line => line.split(':').pop()?.trim() || '')
          .filter(n => n);
      }
      if (numbers.length === 0) {
        setMessage('ไม่พบเบอร์ใดๆ');
        setMessageType('error');
        setLoading(false);
        return;
      }
      const chunks: string[][] = [];
      for (let i = 0; i < numbers.length; i += groupSize) {
        chunks.push(numbers.slice(i, i + groupSize));
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
      const existingRaw = localStorage.getItem('number-sets');
      const existing: NumberSet[] = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem('number-sets', JSON.stringify([...existing, newSet]));
      setMessage('สร้างชุดเบอร์สำเร็จ');
      setMessageType('success');
      // clear form
      setName('');
      setManualText('');
      setFile(null);
      setFileName('');
      setGroupSize(100);
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
            label="กรอกเบอร์ทีละบรรทัด"
            placeholder="0812345678"
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

        <TextField
          label="แยกเป็นชุดละกี่เบอร์"
          type="number"
          value={groupSize}
          onChange={e => setGroupSize(Number(e.target.value) || 1)}
          fullWidth
        />

        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'ดำเนินการต่อ'}
        </Button>
      </Stack>

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