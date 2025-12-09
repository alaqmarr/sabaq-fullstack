const { PrismaClient } = require("../app/prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function applyIndexes() {
  console.log("📊 Applying performance indexes...");

  const sqlFile = path.join(
    __dirname,
    "../prisma/migrations/add_performance_indexes.sql"
  );
  const sql = fs.readFileSync(sqlFile, "utf-8");

  // Split by semicolon and filter empty statements
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  try {
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(statement);
    }
    console.log("✅ All indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes();
