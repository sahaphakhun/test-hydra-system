# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# ติดตั้งทุก dependencies (รวม devDependencies)
COPY package*.json ./
RUN npm install

# คัดลอกโค้ดและ build TypeScript
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine AS runner
WORKDIR /app

# คัดลอกโฟลเดอร์ dist ที่ build เสร็จแล้ว
COPY --from=builder /app/dist ./dist

# ติดตั้งเฉพาะ production dependencies
COPY package*.json ./
RUN npm install --production

# เปิดพอร์ตตามที่เซิร์ฟเวอร์ตั้ง
EXPOSE 3001

# เริ่มรันในโหมด production
CMD ["npm", "start"] 