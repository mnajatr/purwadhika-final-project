import midtransClient from "midtrans-client";

export const snap = new midtransClient.Snap({
  isProduction: false,
  clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
});
