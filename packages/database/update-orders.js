import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

async function updateOrderStatus() {
  try {
    // Update order 12 to PAYMENT_REVIEW
    await prisma.order.update({
      where: { id: 12 },
      data: { status: "PAYMENT_REVIEW" },
    });

    // Update order 11 to PROCESSING
    await prisma.order.update({
      where: { id: 11 },
      data: { status: "PROCESSING" },
    });

    console.log("Order statuses updated successfully");
  } catch (error) {
    console.error("Error updating order status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOrderStatus();
