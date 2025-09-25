#!/usr/bin/env node
// Usage:
// node apps/api/scripts/generate-midtrans-signature.js --order_id=order-123 --status_code=200 --gross_amount=10000 [--serverKey=SB-Midtrans-Server-Key-xxx]

import crypto from "crypto";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const a of args) {
    const [k, v] = a.split("=");
    const key = k.replace(/^--/, "");
    out[key] = v;
  }
  return out;
}

(async function main() {
  const args = parseArgs();
  const order_id = args.order_id || args.orderId || args.order || "";
  const status_code = args.status_code || args.statusCode || "200";
  const gross_amount = args.gross_amount || args.grossAmount || "";
  const serverKey = args.serverKey || process.env.MIDTRANS_SERVER_KEY || "";

  if (!order_id || !gross_amount) {
    console.error(
      "Missing required args. Example: --order_id=order-123 --status_code=200 --gross_amount=10000"
    );
    process.exit(1);
  }

  if (!serverKey) {
    console.error(
      "Missing serverKey. Provide via --serverKey or set MIDTRANS_SERVER_KEY env var"
    );
    process.exit(1);
  }

  const input = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const sig = crypto.createHash("sha512").update(input).digest("hex");
  console.log(sig);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
