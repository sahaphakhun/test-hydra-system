# Stage 1: Build frontend
FROM node:20-alpine as builder
WORKDIR /app

# Install dependencies for UI
COPY package*.json ./
RUN npm install

# Copy UI source code
COPY . .

# Build Next.js app
# RUN npm run build

# Stage 2: Prepare runtime
FROM node:20-alpine
WORKDIR /app

# Copy built UI
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Expose port and start server
EXPOSE 3000
CMD ["npm", "run", "start:ts"] 