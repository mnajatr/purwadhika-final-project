#!/usr/bin/env node
// Usage:
// node apps/api/scripts/send-webhook-test.js --order_id=order-25-... --gross_amount=10000 [--status_code=200] [--transaction_status=settlement] [--webhook=http://localhost:8000/api/payments/webhook] [--serverKey=...]

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
  // resolve fetch: prefer global, otherwise dynamically import node-fetch
  let fetchFn = null;
  if (typeof globalThis.fetch === "function") {
    fetchFn = globalThis.fetch.bind(globalThis);
  } else {
    try {
      const mod = await import("node-fetch");
      fetchFn = mod.default ?? mod;
    } catch (e) {
      console.error(
        "node-fetch is not installed and global fetch is not available. Install node-fetch or use Node >=18."
      );
      process.exit(1);
    }
  }

  const argv = parseArgs();
  const order_id = argv.order_id;
  const gross_amount = argv.gross_amount;
  const status_code = argv.status_code || "200";
  const transaction_status = argv.transaction_status || "settlement";
  const transaction_id = argv.transaction_id || `tx-${Date.now()}`;
  const webhook =
    argv.webhook ||
    process.env.WEBHOOK_URL ||
    "http://localhost:8000/api/payments/webhook";
  const serverKey = argv.serverKey || process.env.MIDTRANS_SERVER_KEY;

  if (!order_id || !gross_amount) {
    console.error(
      "Missing required args. Example: --order_id=order-25-... --gross_amount=10000"
    );
    process.exit(1);
  }
  if (!serverKey) {
    console.error(
      "Missing serverKey. Provide via --serverKey or set MIDTRANS_SERVER_KEY env var."
    );
    console.error("You can also pass --serverKey=SB-Midtrans-Server-Key-xxxx");
    process.exit(1);
  }

  // allow overriding signature_key when debugging against a running server
  const signature_key =
    argv.signature_key ||
    crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

  const payload = {
    order_id,
    status_code,
    gross_amount: String(gross_amount),
    transaction_status,
    transaction_id,
    signature_key,
  };

  console.log("Posting webhook to", webhook);
  console.log("Payload:", payload);

  try {
    const res = await fetchFn(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response body:", text);
  } catch (err) {
    console.error("Failed to POST webhook:", err.message || err);
    process.exit(1);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
