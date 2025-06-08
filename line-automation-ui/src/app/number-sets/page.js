"use strict";
// 'use client' directive enables client-side React hooks
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
const api_1 = __importDefault(require("@/lib/api"));
function NumberSetsPage() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [name, setName] = (0, react_1.useState)('');
    const [inputType, setInputType] = (0, react_1.useState)('manual');
    const [manualText, setManualText] = (0, react_1.useState)('');
    const [file, setFile] = (0, react_1.useState)(null);
    const [fileName, setFileName] = (0, react_1.useState)('');
    const [groupSize, setGroupSize] = (0, react_1.useState)(100);
    const [message, setMessage] = (0, react_1.useState)(null);
    const [messageType, setMessageType] = (0, react_1.useState)('success');
    const handleFileChange = (e) => {
        var _a;
        const f = ((_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) || null;
        setFile(f);
        setFileName((f === null || f === void 0 ? void 0 : f.name) || '');
    };
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        if (loading)
            return;
        if (!name.trim()) {
            setMessage('กรุณาระบุชื่อชุดเบอร์');
            setMessageType('error');
            return;
        }
        setLoading(true);
        let numbers = [];
        try {
            if (inputType === 'manual') {
                numbers = manualText
                    .split(/\r?\n/)
                    .map(n => n.trim())
                    .filter(n => n);
            }
            else if (inputType === 'text') {
                if (!file) {
                    setMessage('กรุณาเลือกไฟล์ .txt');
                    setMessageType('error');
                    setLoading(false);
                    return;
                }
                const text = yield file.text();
                numbers = text
                    .split(/\r?\n/)
                    .map(n => n.trim())
                    .filter(n => n);
            }
            else if (inputType === 'vcf') {
                if (!file) {
                    setMessage('กรุณาเลือกไฟล์ .vcf');
                    setMessageType('error');
                    setLoading(false);
                    return;
                }
                const text = yield file.text();
                const lines = text.split(/\r?\n/);
                numbers = lines
                    .filter(line => /^TEL[:;]/i.test(line))
                    .map(line => { var _a; return ((_a = line.split(':').pop()) === null || _a === void 0 ? void 0 : _a.trim()) || ''; })
                    .filter(n => n);
            }
            if (numbers.length === 0) {
                setMessage('ไม่พบเบอร์ใดๆ');
                setMessageType('error');
                setLoading(false);
                return;
            }
            const chunks = [];
            for (let i = 0; i < numbers.length; i += groupSize) {
                chunks.push(numbers.slice(i, i + groupSize));
            }
            const newId = Date.now().toString() + Math.random().toString(36).slice(2);
            const newSet = {
                id: newId,
                name: name.trim(),
                inputType,
                rawData: inputType === 'manual' ? manualText : fileName,
                chunks,
                createdAt: new Date().toISOString(),
            };
            yield api_1.default.post('/number-sets', newSet);
            const existingRaw = localStorage.getItem('number-sets');
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            localStorage.setItem('number-sets', JSON.stringify([...existing, newSet]));
            setMessage('สร้างชุดเบอร์สำเร็จ');
            setMessageType('success');
            // clear form
            setName('');
            setManualText('');
            setFile(null);
            setFileName('');
            setGroupSize(100);
        }
        catch (error) {
            console.error(error);
            setMessage('เกิดข้อผิดพลาด');
            setMessageType('error');
        }
        finally {
            setLoading(false);
        }
    });
    return (<material_1.Container maxWidth="sm" sx={{ py: 4 }}>
      <material_1.Typography variant="h4" gutterBottom>
        สร้างชุดเบอร์
      </material_1.Typography>
      <material_1.Stack spacing={2}>
        <material_1.TextField label="ชื่อชุดเบอร์" value={name} onChange={e => setName(e.target.value)} required fullWidth/>
        <material_1.FormControl fullWidth>
          <material_1.InputLabel>รูปแบบการเพิ่มเบอร์</material_1.InputLabel>
          <material_1.Select value={inputType} label="รูปแบบการเพิ่มเบอร์" onChange={e => setInputType(e.target.value)}>
            <material_1.MenuItem value="manual">แบบพิมข้อความเอง</material_1.MenuItem>
            <material_1.MenuItem value="text">แบบไฟล์ Text</material_1.MenuItem>
            <material_1.MenuItem value="vcf">แบบไฟล์ VCF</material_1.MenuItem>
          </material_1.Select>
        </material_1.FormControl>

        {inputType === 'manual' && (<material_1.TextField label="กรอกเบอร์ทีละบรรทัด" placeholder="0812345678" multiline rows={6} value={manualText} onChange={e => setManualText(e.target.value)} fullWidth/>)}

        {(inputType === 'text' || inputType === 'vcf') && (<material_1.Button variant="outlined" component="label">
            เลือกไฟล์ {inputType === 'text' ? '.txt' : '.vcf'}
            <input type="file" hidden accept={inputType === 'text' ? '.txt' : '.vcf'} onChange={handleFileChange}/>
          </material_1.Button>)}
        {fileName && (<material_1.Typography variant="body2">ไฟล์: {fileName}</material_1.Typography>)}

        <material_1.TextField label="แยกเป็นชุดละกี่เบอร์" type="number" value={groupSize} onChange={e => setGroupSize(Number(e.target.value) || 1)} fullWidth/>

        <material_1.Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'ดำเนินการต่อ'}
        </material_1.Button>
      </material_1.Stack>

      <material_1.Snackbar open={!!message} autoHideDuration={3000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setMessage(null)}>
        <material_1.Alert severity={messageType} onClose={() => setMessage(null)}>
          {message}
        </material_1.Alert>
      </material_1.Snackbar>
    </material_1.Container>);
}
exports.default = NumberSetsPage;
