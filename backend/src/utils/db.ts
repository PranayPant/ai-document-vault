import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@generated/prisma';
import Database from 'better-sqlite3';

const connectionString = process.env.DATABASE_URL?.replace('file:', '') || 'dev.db';

const db = new Database(connectionString);

const adapter = new PrismaBetterSqlite3({ url: `file:${connectionString}` });

export const prisma = new PrismaClient({ adapter });