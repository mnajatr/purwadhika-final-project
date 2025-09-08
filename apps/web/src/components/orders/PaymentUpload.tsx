"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  orderId: number;
  apiBase: string;
};

export default function PaymentUpload({ orderId, apiBase }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setFile(f ?? null);
    setMessage(null);
  };

  const onSubmit = async () => {
    if (!file) {
      setMessage("Pilih file bukti pembayaran terlebih dahulu.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // send as multipart/form-data using FormData to avoid base64 overhead
      const fd = new FormData();
      fd.append("proof", file);

      const res = await fetch(`${apiBase}/orders/${orderId}/payment-proof`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        setMessage(`Upload failed: ${res.status} ${txt}`);
      } else {
        const json = await res.json();
        // successResponse wraps data in { success: true, data: ... }
        const payload = json?.data ?? json;
        const { proofUrl, orderStatus } = payload ?? {};

        setMessage(
          proofUrl
            ? `Upload berhasil. Status order: ${orderStatus}. Preview: ${proofUrl}`
            : "Upload berhasil. Mohon tunggu konfirmasi admin."
        );
        setFile(null);

        // refresh the current route so server components (order page) re-fetch
        // and reflect the updated order/payment status without manual refresh
        try {
          router.refresh();
        } catch {
          // ignore: router.refresh may not be available in some test envs
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm text-muted-foreground">
        Upload bukti bayar
      </label>
      <input type="file" accept="image/*" onChange={onChange} />
      <div className="flex items-center gap-2">
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? "Uploading..." : "Upload Bukti Bayar"}
        </Button>
        <Button variant="ghost" onClick={() => setFile(null)}>
          Clear
        </Button>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
