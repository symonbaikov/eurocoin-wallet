# syntax=docker/dockerfile:1.6

# Simplified production Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ linux-headers

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy app files
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node_modules/.bin/next", "start"]
