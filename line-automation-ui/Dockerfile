FROM node:18-alpine
WORKDIR /app

# รับค่า NEXT_PUBLIC_API_URL และ NEXT_PUBLIC_WS_URL จาก build-arg/Environment เพื่อ embed ใน Next.js build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 8080

# Start Next.js server
CMD ["npm", "start"] 