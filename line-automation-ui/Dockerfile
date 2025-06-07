FROM node:18-alpine
WORKDIR /app

# รับค่า NEXT_PUBLIC_SERVER_URL จาก build-arg/Environment เพื่อ embed ใน Next.js build
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start Next.js server
CMD ["npm", "start"] 