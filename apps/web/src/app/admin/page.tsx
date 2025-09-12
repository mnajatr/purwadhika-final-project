"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/hooks/useProduct";
import Sidebar from "@/components/admin/sidebar";

export default function admin() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Konten utama */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1>Hello</h1>
        </div>
      </div>
    </div>
  );
}
