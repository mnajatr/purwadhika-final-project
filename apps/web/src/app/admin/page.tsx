"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    const storedStoreId = localStorage.getItem("storeId") || "";

    setRole(storedRole);
    setStoreId(storedStoreId);

    if (storedRole !== "SUPER_ADMIN" && storedRole !== "STORE_ADMIN") {
      router.replace("/unauthorized");
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Checking access...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Konten utama */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>
              Selamat datang di halaman dashboard admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-center">
            <p>
              <span className="font-medium text-gray-700">Role:</span> {role}
            </p>
            <p>
              <span className="font-medium text-gray-700">Store ID:</span>{" "}
              {storeId}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
