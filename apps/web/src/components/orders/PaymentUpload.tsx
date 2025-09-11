"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderDetail } from "@/hooks/useOrder";

type Props = {
  orderId: number;
  apiBase: string;
};

export default function PaymentUpload({ orderId, apiBase }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
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

        // API may return either { data: { ... } } or payload directly
        type UploadResponseShape =
          | {
              proofUrl?: string;
              order?: Partial<OrderDetail>;
              orderStatus?: string;
            }
          | Partial<OrderDetail>;

        const payload = (json?.data ?? json) as UploadResponseShape;
        const proofUrl = (
          payload as UploadResponseShape & Record<string, unknown>
        )?.proofUrl as string | undefined;
        const orderStatusFromPayload = (
          payload as UploadResponseShape & Record<string, unknown>
        )?.orderStatus as string | undefined;

        setMessage(
          proofUrl
            ? `Upload berhasil. Status order: ${
                orderStatusFromPayload ?? "updated"
              }. Preview: ${proofUrl}`
            : "Upload berhasil. Mohon tunggu konfirmasi admin."
        );
        setFile(null);

        // Try to update cached order so UI shows new status immediately.
        try {
          const returnedOrder =
            (payload as { order?: Partial<OrderDetail> }).order ??
            (payload as Partial<OrderDetail>);

          if (returnedOrder && typeof returnedOrder === "object") {
            // Normalize possible `orderStatus` -> `status` and merge with existing cached order
            const normalizedOrder: Partial<OrderDetail> & {
              orderStatus?: string;
            } = {
              ...returnedOrder,
            } as Partial<OrderDetail> & { orderStatus?: string };

            if (
              "orderStatus" in normalizedOrder &&
              !("status" in normalizedOrder)
            ) {
              (normalizedOrder as Record<string, unknown>).status = (
                normalizedOrder as Record<string, unknown>
              ).orderStatus as string;
              delete (normalizedOrder as Record<string, unknown>).orderStatus;
            }

            qc.setQueryData<OrderDetail | undefined>(
              ["order", orderId],
              (prev) => {
                // merge previous full order with partial update
                return {
                  ...(prev ?? {}),
                  ...(normalizedOrder as Partial<OrderDetail>),
                } as OrderDetail;
              }
            );
          } else {
            qc.invalidateQueries({ queryKey: ["order", orderId] });
          }
        } catch {
          // if anything fails, fallback to server revalidation
          try {
            router.refresh();
          } catch {
            // no-op
          }
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
