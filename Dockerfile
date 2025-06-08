# Multi-stage build for LINE Automation System

# Stage 1: Build frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend

# Copy frontend package files
COPY line-automation-ui/package*.json ./
RUN npm install

# Copy frontend source and build
COPY line-automation-ui/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine as backend-builder
WORKDIR /app/backend

# Copy backend package files
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy backend source
COPY src/ ./src/
COPY line-automation-api/ ./line-automation-api/

# Build backend
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine
WORKDIR /app

# Install production dependencies for backend
COPY package*.json ./
RUN npm install --only=production

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next ./line-automation-ui/.next
COPY --from=frontend-builder /app/frontend/public ./line-automation-ui/public
COPY --from=frontend-builder /app/frontend/package*.json ./line-automation-ui/
COPY --from=frontend-builder /app/frontend/next.config.ts ./line-automation-ui/

# Install frontend production dependencies
WORKDIR /app/line-automation-ui
RUN npm install --only=production

# Back to app root
WORKDIR /app

# Create startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'cd /app/line-automation-ui && npm start &' >> start.sh && \
    echo 'cd /app && npm start' >> start.sh && \
    chmod +x start.sh

# Expose ports
EXPOSE 3000 8080

# Start both services
CMD ["./start.sh"] 