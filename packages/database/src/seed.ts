import { PrismaClient } from "../generated/prisma/index.js";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function seed() {
  try {
    await prisma.user.deleteMany();

    for (let i = 0; i < 10; i++) {
      const name = faker.person.fullName();
      const email = faker.internet.email();

      await prisma.user.create({ data: { name, email } });

      console.info(`User with name: ${name} has been created`);
    }

    console.info("\n🌱 Seeded 10 users");
  } catch (error) {
    console.error("\n🤦🏼‍♂️ Seeding failed", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
