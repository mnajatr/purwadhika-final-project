"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const [userId, setUserId] = useState<number>(1);
  const { data: cart } = useCart(userId, 1);

  // Calculate cart totals from cart data
  const itemCount = cart?.items?.length || 0;
  const totalAmount = cart?.items?.reduce((sum, item) => {
    const unitPrice = Number(item.product?.price ?? 0) || 0;
    return sum + unitPrice * item.qty;
  }, 0) || 0;

  // Get development user ID from localStorage
  useEffect(() => {
    const devUserId = localStorage.getItem("devUserId");
    if (devUserId && devUserId !== "none") {
      setUserId(parseInt(devUserId));
    } else {
      setUserId(1); // Default user for demo
    }
  }, []);

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              Grocery Store
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/products"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Products
            </Link>
          </div>

          {/* Cart and User Actions */}
          <div className="flex items-center space-x-4">
            {/* User Icon */}
            <div className="flex items-center space-x-2 text-gray-700">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm">User {userId}</span>
            </div>

            {/* Cart Icon with Badge */}
            <Link
              href="/cart"
              className="relative flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg transition-colors"
            >
              <div className="relative">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <span className="text-xs">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-indigo-600 focus:outline-none focus:text-indigo-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
