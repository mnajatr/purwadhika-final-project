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
    { name: "Orders", path: "/admin/orderManagement" },
    { name: "Reports", path: "/admin/report" },
  ];

  const [role, setRole] = useState("");

  useEffect(() => {
    const rolez = localStorage.getItem("role");
    setRole(rolez ?? "");
  }, []);

  return (
    <div className="flex h-screen">
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="font-bold text-lg">Dashboard</h2>
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
