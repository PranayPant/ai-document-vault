import 'dotenv/config'
// prisma.config.ts
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  // Point to your schema
  schema: 'prisma/schema.prisma',
    migrations: {
    path: 'prisma/migrations',
  },
  // Configure the datasource here instead of inside schema.prisma
  datasource: {
    url: env('DATABASE_URL'),
  },
});