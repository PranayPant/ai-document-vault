import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@generated/prisma';
import Database from 'better-sqlite3';

const connectionString = process.env.DATABASE_URL?.replace('file:', '') || 'dev.db';

// Initialize native SQLite driver
const db = new Database(connectionString);

// Initialize Prisma Adapter
const adapter = new PrismaBetterSqlite3({ url: `file:${connectionString}` });

// Instantiate Client
export const prisma = new PrismaClient({ adapter });