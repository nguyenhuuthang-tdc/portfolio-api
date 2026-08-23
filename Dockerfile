ARG NODE_VERSION=22.12.0-alpine

# Stage 1: build
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# dependencies install layer cache
COPY package*.json ./
RUN npm ci

# 
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ARG APP_PORT=4000
ENV PORT=${APP_PORT}

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads

EXPOSE ${APP_PORT}

CMD ["node", "dist/app.js"]
