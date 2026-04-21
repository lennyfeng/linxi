# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src/ ./src/

RUN npx vite build

# Stage 2: Serve
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY src/dev-server.js ./dev-server.js

EXPOSE 3200

CMD ["node", "dev-server.js"]
