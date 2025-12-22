FROM node:22-slim

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client with a DATABASE_URL
ENV DATABASE_URL="file:./dev.db"
RUN pnpm generate

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start the server (db:push will run at startup)
CMD ["sh", "-c", "pnpm db:push && pnpm start"]
