"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const menus = [
    { name: "Home", path: "/products" },
    { name: "Users", path: "/admin/userManagement" },
    { name: "Products", path: "/admin/productManagement" },
    { name: "Inventory", path: "/admin/inventoryManagement" },
    { name: "Discounts", path: "/admin/discountManagement" },
    { name: "Category", path: "/admin/categoryManagement" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Reports", path: "/admin/report" },
  ];

  const [store, setStore] = useState("");
  const [devUserId, setDevUserId] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const devUserIdz = localStorage.getItem("devUserId");
    setDevUserId(devUserIdz ?? "");
    const rolez = localStorage.getItem("role");
    setRole(rolez ?? "");
    const storeId = localStorage.getItem("storeId");
    setStore(storeId ? `-${storeId}` : "");
  }, []);

  return (
    <div className="flex h-screen">
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="font-bold text-lg">Dashboard</h2>
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-2 p-2 bg-gray-700 rounded">
            <label className="block text-xs text-gray-300 mb-1">Dev user</label>
            <select
              value={devUserId ? `${devUserId}-${role}${store}` : "4-USER"}
              onChange={(e) => {
                try {
                  const target = e.target.value;
                  const [devUserId, role, storeId] = target.split("-");
                  localStorage.setItem("devUserId", devUserId);
                  localStorage.setItem("role", role);
                  localStorage.setItem("storeId", storeId ?? "");
                  window.location.reload();
                } catch {}
              }}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value="none">(none)</option>
              <option value="1-SUPER_ADMIN">1 - SUPER_ADMIN</option>
              <option value="2-STORE_ADMIN-1">2 - STORE_ADMIN (Bandung)</option>
              <option value="3-STORE_ADMIN-2">3 - STORE_ADMIN (Jakarta)</option>
              <option value="4-USER">4 - Normal User</option>
              <option value="5-USER">5 - Normal User 5</option>
            </select>
          </div>
        )}
        <ul className="space-y-2">
          {menus
            .filter((menu) => {
              // Kalau menu "Users", hanya tampil untuk SUPER_ADMIN
              if (menu.name === "Users" && role !== "SUPER_ADMIN") return false;
              return true;
            })
            .map((menu) => (
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
