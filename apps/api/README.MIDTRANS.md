Postman guide — testing Midtrans Snap & webhook

This file explains how to test the Midtrans endpoints in this API using Postman.

Prerequisites

- API running locally (e.g. `npm run dev` in `apps/api`) and reachable at `http://localhost:PORT`.
- Environment variables set for API process: MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY.
- Order exists in DB and its status is `PENDING_PAYMENT`.

Endpoints

1. Create Snap token (server creates Midtrans transaction)

- POST /api/orders/:id/snap
  - Example: POST http://localhost:3000/api/orders/123/snap
  - Headers: Content-Type: application/json
  - Body: (empty)
  - Response: JSON containing `data.clientKey` and `data.snapToken`.

2. Webhook endpoint (simulate Midtrans notification)

- POST /api/payments/webhook
  - URL: http://localhost:3000/api/payments/webhook
  - Headers: Content-Type: application/json
  - Body: raw JSON with fields including `order_id`, `status_code`, `gross_amount`, `transaction_status`, `transaction_id`, `signature_key`.

Signature calculation

- The backend uses SHA512(order_id + status_code + gross_amount + serverKey)
- You can compute `signature_key` with either the provided Node script or inside Postman using CryptoJS.

Generate signature locally (Node)

- Run:
  node apps/api/scripts/generate-midtrans-signature.js --order_id=order-123-1695700000000 --status_code=200 --gross_amount=10000 --serverKey=SB-Midtrans-Server-Key-xxx
- The script will print the signature which you can paste into the JSON body as `signature_key`.

Postman pre-request script (compute signature inside Postman)

- In Postman, for the `POST /api/payments/webhook` request, add the following Pre-request Script:

```javascript
// Postman pre-request script to compute Midtrans signature_key
const order_id =
  pm.environment.get("midtrans_order_id") || "order-123-1695700000000";
const status_code = pm.environment.get("midtrans_status_code") || "200";
const gross_amount = pm.environment.get("midtrans_gross_amount") || "10000";
const serverKey =
  pm.environment.get("MIDTRANS_SERVER_KEY") || "SB-Midtrans-Server-Key-xxx";

// CryptoJS is available in Postman sandbox
const input = order_id + status_code + gross_amount + serverKey;
const sig = CryptoJS.SHA512(input).toString();
pm.environment.set("midtrans_signature", sig);
```

- Then in the request body use `{{midtrans_signature}}` for the `signature_key` field.

Sample webhook body (replace values / use variable names):

```json
{
  "order_id": "order-123-1695700000000",
  "status_code": "200",
  "gross_amount": "10000",
  "transaction_status": "settlement",
  "transaction_id": "abc123xyz",
  "signature_key": "{{midtrans_signature}}"
}
```

What to expect

- If signature matches and payment record found, server returns 200 OK and will update payment/order in DB (payment.status -> PAID, order.status -> PROCESSING).
- If signature mismatch or payment not found, server returns 400 with an error message.

Troubleshooting

- If you get a 400 Invalid signature: confirm you used the correct `order_id`, `status_code`, `gross_amount`, and `serverKey` values.
- If payment not found: ensure the order has a `payment` record whose `gatewayTransactionId` matches the `order_id` you used in payload. You can create the payment by calling `/api/orders/:id/snap` first.

If you want, I can also add a Postman collection JSON to the repo with ready-made requests.
