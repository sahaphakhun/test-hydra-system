# Stage 1: Build both API and UI
FROM node:18-alpine AS builder
WORKDIR /app

# Build API
COPY line-automation-api/package*.json line-automation-api/
WORKDIR /app/line-automation-api
RUN npm install
COPY line-automation-api/ .
RUN npm run build

# Build UI
WORKDIR /app
COPY line-automation-ui/package*.json line-automation-ui/
WORKDIR /app/line-automation-ui
RUN npm install
COPY line-automation-ui/ .
RUN npm run build

# Stage 2: Setup runtime
FROM node:18-alpine AS runner
WORKDIR /app

# Copy backend dist
COPY --from=builder /app/line-automation-api/dist ./line-automation-api/dist

# Copy UI build output
COPY --from=builder /app/line-automation-ui/.next ./line-automation-ui/.next
COPY --from=builder /app/line-automation-ui/public ./line-automation-ui/public

# Copy server.js and package.json for runtime dependencies
COPY server.js ./
COPY package.json ./

# Install only production dependencies
RUN npm install --production

EXPOSE 3000
CMD ["node", "server.js"] 