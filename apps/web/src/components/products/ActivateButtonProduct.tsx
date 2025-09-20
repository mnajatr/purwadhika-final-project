"use client";

import { useActivateProduct } from "@/hooks/useProduct";

export default function ActivateButtonProduct({ slug }: { slug: string }) {
  const activate = useActivateProduct();

  const handleActivate = () => {
    if (confirm("Yakin ingin mengaktifkan kembali produk ini?")) {
      activate.mutate(slug, {
        onSuccess: () => {
          alert("Produk berhasil diaktifkan");
        },
        onError: (e: Error) => {
          alert("Gagal mengaktifkan produk: " + e.message);
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleActivate}
      disabled={activate.isPending}
      className="text-green-600 hover:underline"
    >
      {activate.isPending ? "Processing..." : "Activate"}
    </button>
  );
}
