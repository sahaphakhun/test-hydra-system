# 🚀 คู่มือการตั้งค่า Environment Variables ใน Railway

## 📋 Environment Variables ที่จำเป็น

### **1. MONGO_URL** (สำคัญที่สุด)
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/line-automation
```

**วิธีหา:**
- **MongoDB Atlas (แนะนำ):**
  1. ไปที่ [MongoDB Atlas](https://cloud.mongodb.com)
  2. สร้าง Account และ Cluster ใหม่ (Free Tier)
  3. สร้าง Database User: Database Access → Add New Database User
  4. เพิ่ม IP Whitelist: Network Access → Add IP Address → `0.0.0.0/0`
  5. คลิก "Connect" → "Connect your application"
  6. เลือก "Node.js" และ copy connection string
  7. แทนที่ `<password>` ด้วยรหัสผ่านจริง

- **Railway MongoDB:**
  1. ใน Railway Dashboard → "Add Service" → "MongoDB"
  2. หลัง deploy เสร็จ → ไปที่ Variables tab
  3. Copy ค่า `MONGO_URL`

### **2. NEXT_PUBLIC_API_URL** (Frontend)
```
NEXT_PUBLIC_API_URL=https://your-app-name.up.railway.app
```

**วิธีหา:**
- หลังจาก deploy backend ใน Railway แล้ว
- ไปที่ Railway Dashboard → เลือกโปรเจ็กต์ → ดู URL ที่ได้

### **3. NEXT_PUBLIC_WS_URL** (Frontend)
```
NEXT_PUBLIC_WS_URL=wss://your-app-name.up.railway.app
```

**วิธีหา:**
- ใช้ URL เดียวกับ `NEXT_PUBLIC_API_URL`
- แต่เปลี่ยน `https://` เป็น `wss://`

### **4. PORT** (Optional)
```
PORT=8080
```
- Railway จะตั้งให้อัตโนมัติ
- ไม่จำเป็นต้องตั้งเอง

## 🔧 วิธีการตั้งค่าใน Railway

### **ขั้นตอนที่ 1: เข้าสู่ Railway Dashboard**
1. ไปที่ [Railway.app](https://railway.app)
2. Login และเลือกโปรเจ็กต์ของคุณ

### **ขั้นตอนที่ 2: ตั้งค่า Variables**
1. คลิกที่แท็บ **"Variables"**
2. คลิก **"Add Variable"**
3. เพิ่มตัวแปรทีละตัว:

```bash
# ตัวแปรที่จำเป็น
MONGO_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/line-automation
NEXT_PUBLIC_API_URL=https://test-hydra-system-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://test-hydra-system-production.up.railway.app
```

### **ขั้นตอนที่ 3: Deploy**
1. กด **"Deploy"** หรือ push โค้ดใหม่
2. รอให้ build เสร็จ
3. ตรวจสอบ logs ว่าไม่มี error

## ⚠️ ข้อควรระวัง

### **1. NEXT_PUBLIC_* Variables**
- ต้องขึ้นต้นด้วย `NEXT_PUBLIC_` เท่านั้น
- Next.js จึงจะส่งไปยัง browser ได้
- **ห้าม** ใส่ข้อมูลลับใน NEXT_PUBLIC_*

### **2. MongoDB Connection String**
- ต้องมี username, password, และ database name
- ตรวจสอบให้แน่ใจว่า IP whitelist เป็น `0.0.0.0/0`
- Database name ควรเป็น `line-automation`

### **3. URL Format**
- API URL: `https://domain.com` (ไม่มี trailing slash)
- WebSocket URL: `wss://domain.com` (ไม่มี trailing slash)

## 🧪 การทดสอบ

### **ตรวจสอบ Backend:**
```bash
curl https://your-app-name.up.railway.app/api/health
```

### **ตรวจสอบ Frontend:**
1. เปิด browser ไปที่ `https://your-app-name.up.railway.app`
2. เปิด Developer Tools (F12)
3. ดู Console ว่าไม่มี error
4. ดู Network tab ว่า API calls สำเร็จ

### **ตรวจสอบ WebSocket:**
1. เปิด Network tab ใน Developer Tools
2. กรอง "WS" (WebSocket)
3. ดูว่ามีการเชื่อมต่อ WebSocket สำเร็จ

## 🐛 การแก้ไขปัญหา

### **MongoDB Connection Failed:**
```
Error: MongoNetworkError: failed to connect to server
```
**แก้ไข:**
- ตรวจสอบ MONGO_URL ว่าถูกต้อง
- ตรวจสอบ IP whitelist ใน MongoDB Atlas
- ตรวจสอบ username/password

### **API Not Found:**
```
Error: Network Error / 404 Not Found
```
**แก้ไข:**
- ตรวจสอบ NEXT_PUBLIC_API_URL
- ตรวจสอบว่า backend deploy สำเร็จ
- ตรวจสอบ Railway logs

### **WebSocket Connection Failed:**
```
WebSocket connection failed
```
**แก้ไข:**
- ตรวจสอบ NEXT_PUBLIC_WS_URL
- ระบบจะใช้ polling แทนอัตโนมัติ
- ไม่ส่งผลต่อการทำงานหลัก

## 📝 ตัวอย่าง Environment Variables

```bash
# Production Environment Variables
MONGO_URL=mongodb+srv://lineuser:mypassword123@cluster0.abc123.mongodb.net/line-automation
NEXT_PUBLIC_API_URL=https://test-hydra-system-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://test-hydra-system-production.up.railway.app
```

## 🔗 ลิงก์ที่เป็นประโยชน์

- [MongoDB Atlas](https://cloud.mongodb.com)
- [Railway Documentation](https://docs.railway.app)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**หมายเหตุ:** หลังจากตั้งค่าเสร็จแล้ว ให้ทดสอบเข้าหน้า `/adminn` เพื่อดูว่าไม่มี JavaScript error แล้ว 