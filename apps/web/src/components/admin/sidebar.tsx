"use client";

import Link from "next/link";
import Image from "next/image";

export default function Sidebar() {
  const menus = [
    { name: "Home", path: "/products" },
    { name: "Users", path: "/admin/userManagement" },
    { name: "Products", path: "/admin/productManagement" },
    { name: "Inventory", path: "/admin/inventoryManagement" },
    { name: "Discounts", path: "/admin/discountManagement" },
    { name: "Category", path: "/admin/categoryManagement" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Reports", path: "/admin/reports" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="font-bold text-lg">Dashboard</h2>
        {/* TODO: DEV user switch - only visible in development */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-2 p-2 bg-gray-700 rounded">
            <label className="block text-xs text-gray-300 mb-1">Dev user</label>
            <select
              defaultValue={
                typeof window !== "undefined"
                  ? localStorage.getItem("devUserId") || "4"
                  : "4"
              }
              onChange={(e) => {
                try {
                  localStorage.setItem("devUserId", e.target.value);
                  // small visual feedback by reloading page so callers pick up header
                  window.location.reload();
                } catch {
                  // ignore
                }
              }}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value="none">(none)</option>
              <option value="1">1 - SUPER_ADMIN</option>
              <option value="2">2 - STORE_ADMIN (Bandung)</option>
              <option value="3">3 - STORE_ADMIN (Jakarta)</option>
              <option value="4">4 - Normal User</option>
            </select>
          </div>
        )}
        <ul className="space-y-2">
          {menus.map((menu) => (
            <li key={menu.path}>
              <Link href={menu.path} className="hover:text-blue-400">
                {menu.name}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
