"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/sidebar";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data dari localStorage
    const storedRole = localStorage.getItem("role") || "";
    const storedStoreId = localStorage.getItem("storeId") || "";

    setRole(storedRole);
    setStoreId(storedStoreId);

    // Cek role
    if (storedRole !== "SUPER_ADMIN" && storedRole !== "STORE_ADMIN") {
      router.replace("/unauthorized"); // redirect jika bukan admin
      return;
    }

    setLoading(false); // user valid, lanjut render
  }, [router]);

  if (loading) {
    return <div>Checking access...</div>; // loading sementara redirect
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Konten utama */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-x-auto">
        <h1>Hello Admin</h1>
        <p>Role: {role}</p>
        <p>Store ID: {storeId}</p>
      </div>
    </div>
  );
}
