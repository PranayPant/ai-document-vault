// backend/prisma/seed.ts
import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

// 1. Setup DB Connection
const dbPath = path.resolve(process.cwd(), 'prisma', '../dev.db');
const db = new Database(dbPath);
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rootFolderName = 'root'; 

  console.log(`🌱 Seeding database... checking for '${rootFolderName}' folder.`);

  // 2. Find existing root folder
  // We cannot use upsert because of the parentId: null limitation
  let rootFolder = await prisma.folder.findFirst({
    where: {
      name: rootFolderName,
      parentId: null 
    }
  });

  // 3. Create if not exists
  if (!rootFolder) {
    rootFolder = await prisma.folder.create({
      data: {
        name: rootFolderName,
        parentId: null
      }
    });
    console.log(`✅ Created Root Folder: ${rootFolder.id}`);
  } else {
    console.log(`ℹ️ Root Folder already exists: ${rootFolder.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });