"use client";

import Link from "next/link";
import Image from "next/image";

export default function Sidebar() {
  const menus = [
    { name: "Home", path: "/products" },
    { name: "Users", path: "/admin/userManagement" },
    { name: "Products", path: "/admin/productManagement" },
    { name: "Inventory", path: "/admin/inventory" },
    { name: "Discounts", path: "/admin/discountManagement" },
    { name: "Category", path: "/admin/categoryManagement" },
    { name: "Reports", path: "/admin/reports" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="font-bold text-lg">Dashboard</h2>
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
