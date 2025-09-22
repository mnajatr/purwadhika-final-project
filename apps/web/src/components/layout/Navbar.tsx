"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import useLocationStore from "@/stores/locationStore";

export default function Navbar() {
  const [userId, setUserId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? 1;
  const { data: cart } = useCart(userId, nearestStoreId);

  // Calculate cart totals from cart data
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
  const totalAmount =
    cart?.items?.reduce((sum, item) => {
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
    <nav className="bg-card shadow-lg border-b border-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary-foreground"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">Daily Grocery</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fruits, vegetables, dairy..."
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Navigation Links & Actions */}
          <div className="flex items-center space-x-4">
            {/* Navigation Categories */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link
                href="/products?category=fruits"
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                Fruits
              </Link>
              <Link
                href="/products?category=vegetables"
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                Vegetables
              </Link>
              <Link
                href="/products?category=dairy"
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                Dairy
              </Link>
            </div>

            {/* User Profile */}
            <div className="hidden sm:flex items-center space-x-2 bg-muted px-3 py-2 rounded-xl">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {userId.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Hello,</span>
                <span className="text-sm font-medium text-foreground">User {userId}</span>
              </div>
            </div>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative flex items-center space-x-3 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <div className="relative">
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs opacity-90">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <span className="text-sm font-semibold">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </Link>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-muted-foreground hover:text-primary focus:outline-none focus:text-primary p-2"
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
      </div>
    </nav>
  );
}
