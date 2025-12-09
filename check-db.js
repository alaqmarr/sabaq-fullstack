const { PrismaClient } = require("./app/prisma/client");
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const count = await prisma.user.count();
    console.log(`Total users in DB: ${count}`);
    const users = await prisma.user.findMany({ take: 5 });
    console.log("First 5 users:", users);
  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
