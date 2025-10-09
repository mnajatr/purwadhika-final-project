import logger from "../utils/logger.js";
import { qstashClient, QSTASH_URL } from "../configs/qstash.config.js";

export const ORDER_CONFIRM_QUEUE_NAME = "order-confirm-queue";

export type ConfirmOrderJobData = {
  orderId: number;
};

/**
 * Enqueue an order confirmation job using QStash.
 * @param jobName - Name of the job (e.g., "confirm-order")
 * @param data - Job data containing orderId
 * @param opts - Options including delay (in ms)
 */
async function add(
  jobName: string,
  data: ConfirmOrderJobData,
  opts?: { jobId?: string; delay?: number }
): Promise<void> {
  if (!qstashClient || !QSTASH_URL) {
    logger.warn(
      `Skipping enqueue for ${ORDER_CONFIRM_QUEUE_NAME} because QStash is not configured.`
    );
    return;
  }

  try {
    const endpoint = `${QSTASH_URL}/api/workers/order-confirm`;
    const delay = opts?.delay ? Math.floor(opts.delay / 1000) : undefined; // Convert ms to seconds

    await qstashClient.publishJSON({
      url: endpoint,
      body: data,
      delay,
    });

    logger.info(
      `Enqueued ${jobName} for order ${data.orderId} with delay ${delay}s`
    );
  } catch (error) {
    logger.error(`Failed to enqueue ${jobName}:`, error);
    throw error;
  }
}

/**
 * QStash doesn't support job retrieval like BullMQ.
 * This is a no-op for compatibility.
 */
async function getJob(id: string): Promise<null> {
  logger.warn(`getJob is not supported with QStash (job id: ${id})`);
  return null;
}

export const orderConfirmQueue = {
  add,
  getJob,
};

export default orderConfirmQueue;
