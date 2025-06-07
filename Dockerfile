# Stage 1: Build frontend
FROM node:18-alpine AS builder
WORKDIR /app/line-automation-ui

# Install dependencies for UI
COPY line-automation-ui/package*.json ./
RUN npm install

# Copy UI source code
COPY line-automation-ui ./

# Build Next.js app
RUN npm run build

# Stage 2: Prepare runtime
FROM node:18-alpine
WORKDIR /app

# Copy built UI
COPY --from=builder /app/line-automation-ui/.next ./.next
COPY --from=builder /app/line-automation-ui/public ./public

# Copy only production dependencies
COPY line-automation-ui/package*.json ./
RUN npm install --production

# Expose port and start server
EXPOSE 3000
CMD ["npm", "start"] 