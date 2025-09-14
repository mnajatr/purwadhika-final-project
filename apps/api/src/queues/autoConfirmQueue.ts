import { Queue } from "bullmq";
import { redis } from "../configs/redis.config.js";

export const autoConfirmQueue = new Queue("auto-confirm", {
  connection: redis,
});

export const scheduleAutoConfirmation = async (
  orderId: number,
  delayInMs: number
) => {
  await autoConfirmQueue.add(
    "auto-confirm-order",
    { orderId },
    {
      delay: delayInMs,
      jobId: `auto-confirm-${orderId}`, // Unique job ID to prevent duplicates
      removeOnComplete: 5,
      removeOnFail: 10,
    }
  );
};

export const cancelAutoConfirmation = async (orderId: number) => {
  try {
    const job = await autoConfirmQueue.getJob(`auto-confirm-${orderId}`);
    if (job) {
      await job.remove();
    }
  } catch (error) {
    console.warn(
      `Failed to cancel auto-confirmation for order ${orderId}:`,
      error
    );
  }
};
