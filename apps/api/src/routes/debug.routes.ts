import express from "express";
import crypto from "crypto";

const router = express.Router();

// Dev-only: compute midtrans signature using server env var
router.post("/midtrans-signature", (req, res) => {
  const {
    order_id,
    status_code = "200",
    gross_amount,
  } = req.body || req.query || {};
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  if (!order_id || !gross_amount)
    return res
      .status(400)
      .json({ status: "error", message: "order_id and gross_amount required" });
  if (!serverKey)
    return res
      .status(500)
      .json({
        status: "error",
        message: "MIDTRANS_SERVER_KEY not configured on server",
      });

  const input = `${order_id}${String(status_code)}${String(
    gross_amount
  )}${serverKey}`;
  const sig = crypto.createHash("sha512").update(input).digest("hex");
  return res.json({ status: "ok", signature: sig });
});

export default router;
