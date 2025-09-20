"use client";

import { useDeactivateProduct } from "@/hooks/useProduct";

export default function DeactivateButtonProduct({ slug }: { slug: string }) {
  const deactivate = useDeactivateProduct();

  const handleDeactivate = () => {
    if (confirm("Yakin ingin menonaktifkan produk ini?")) {
      deactivate.mutate(slug, {
        onSuccess: () => {
          alert("Produk berhasil dinonaktifkan");
        },
        onError: (e: Error) => {
          alert("Gagal menonaktifkan produk: " + e.message);
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDeactivate}
      disabled={deactivate.isPending}
      className="text-yellow-600 hover:underline"
    >
      {deactivate.isPending ? "Processing..." : "Deactivate"}
    </button>
  );
}
