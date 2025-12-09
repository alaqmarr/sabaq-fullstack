import { prisma } from "@/lib/prisma";
import { PrismaClient } from "../app/prisma/client";
import { Role } from "../app/prisma/enums";
import bcrypt from "bcryptjs";

async function main() {
  const password = await bcrypt.hash("30800976", 12);

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { itsNumber: "30800976" },
    update: {},
    create: {
      id: "30800976", // ID is ITS Number
      itsNumber: "30800976",
      name: "Super Admin",
      email: "admin@sabaq.com",
      role: Role.SUPERADMIN,
      password,
    },
  });

  console.log({ superAdmin });

  // Create Locations
  const locations = [
    {
      name: "Masjid-e-Saifee",
      address: "123 Main St",
      lat: 19.076,
      lng: 72.8777,
    },
    { name: "Burhani Masjid", address: "456 Park Ave", lat: 19.08, lng: 72.88 },
  ];

  for (const loc of locations) {
    const slug = loc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.location.upsert({
      where: { id: slug },
      update: {},
      create: {
        id: slug,
        name: loc.name,
        address: loc.address,
        latitude: loc.lat,
        longitude: loc.lng,
        createdBy: superAdmin.id,
      },
    });
  }

  // Create Sabaqs
  const sabaqs = [
    { name: "Sabaq 1445", kitaab: "Kitaab A", level: "Level 1" },
    { name: "Sabaq 1446", kitaab: "Kitaab B", level: "Level 2" },
  ];

  for (const sabaq of sabaqs) {
    const slug = sabaq.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const location = await prisma.location.findFirst(); // Just grab the first one

    if (location) {
      await prisma.sabaq.upsert({
        where: { id: slug },
        update: {},
        create: {
          id: slug,
          name: sabaq.name,
          kitaab: sabaq.kitaab,
          level: sabaq.level,
          criteria: "Open",
          enrollmentStartsAt: new Date(),
          enrollmentEndsAt: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
          locationId: location.id,
          createdBy: superAdmin.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
