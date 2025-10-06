"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useUser } from "@/hooks/useUsers";
import useLocationStore from "@/stores/locationStore";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  ShoppingCart,
  MapPin,
  ChevronDown,
  User,
  Settings,
  Truck,
  Menu,
  X,
  Search,
  LayoutGrid,
  ShoppingBag,
} from "lucide-react";
import dynamic from "next/dynamic";

const LocationManager = dynamic(() => import("@/components/LocationManager"), {
  ssr: false,
});

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? 1;
  const nearestStoreName = useLocationStore((s) => s.nearestStoreName);
  const activeAddress = useLocationStore((s) => s.activeAddress);
  const { data: cart } = useCart(userId, nearestStoreId);

  // Check if we're on checkout page
  const isCheckoutPage = pathname === "/checkout";

  // Get user data to check role
  const { data: userData } = useUser(userId);
  const isAdmin =
    userData?.role === "SUPER_ADMIN" || userData?.role === "STORE_ADMIN";

  // Dev tools state
  const [devUserId, setDevUserId] = useState("");
  const [role, setRole] = useState("");
  const [storeId, setStoreId] = useState("");

  // Refs for click outside detection
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));
  useClickOutside(categoryDropdownRef, () => setShowCategoryDropdown(false));
  useClickOutside(userDropdownRef, () => setShowUserDropdown(false));

  // Calculate cart totals from cart data
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.qty, 0) || 0;

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get development user ID from localStorage
  useEffect(() => {
    const devUserIdz = localStorage.getItem("devUserId");
    setDevUserId(devUserIdz ?? "");
    const rolez = localStorage.getItem("role");
    setRole(rolez ?? "");
    const storez = localStorage.getItem("storeId");
    setStoreId(storez ?? "");

    if (devUserIdz && devUserIdz !== "none") {
      setUserId(parseInt(devUserIdz));
    } else {
      setUserId(1); // Default user for demo
    }
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Clear search after navigation
    }
  };

  const categories = [
    { name: "Fruits", href: "/products?category=fruits" },
    { name: "Vegetables", href: "/products?category=vegetables" },
    { name: "Dairy", href: "/products?category=dairy" },
    { name: "Fast Food", href: "/products?category=fast-food" },
  ];

  const getCategoryIcon = (name: string) => {
    const icons: Record<string, string> = {
      Fruits: "🍎",
      Vegetables: "🥕",
      Dairy: "🥛",
      "Fast Food": "🍔",
    };
    return icons[name] || "📦";
  };

  return (
    <header className="sticky top-0 z-50 bg-card/98 backdrop-blur-lg shadow-md border-b border-border">
      {/* Main Navbar */}
      <div className="bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side: Logo + Category Dropdown */}
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 bg-primary-gradient rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Growseries
                </span>
              </Link>

              {/* Category Dropdown */}
              <div
                className="hidden md:block relative"
                ref={categoryDropdownRef}
              >
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl transition-all text-primary font-medium shadow-sm hover:shadow"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="text-sm">Category</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showCategoryDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-card rounded-xl shadow-xl border border-border overflow-hidden navbar-dropdown-enter z-50">
                    {categories.map((cat, index) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        onClick={() => setShowCategoryDropdown(false)}
                        className={`block px-4 py-3 hover:bg-primary/5 transition-colors text-foreground font-medium ${
                          index !== categories.length - 1
                            ? "border-b border-border/50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-lg">
                              {getCategoryIcon(cat.name)}
                            </span>
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-6">
              <form onSubmit={handleSearch} className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-12 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-card transition-all"
                />
              </form>
            </div>

            {/* Right Side: Order List, User, Cart, Admin */}
            <div className="flex items-center gap-2">
              {/* Order List Icon */}
              <Link
                href="/orders"
                className="hidden sm:flex items-center gap-2.5 bg-muted/50 hover:bg-muted px-3 py-2 rounded-xl transition-all border border-transparent hover:border-primary/20 group"
                title="My Orders"
              >
                <div className="w-9 h-9 bg-primary-gradient rounded-full flex items-center justify-center shadow-sm group-hover:shadow-lg transition-transform group-hover:scale-105">
                  <ShoppingBag className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Orders
                  </span>
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    My Orders
                  </span>
                </div>
              </Link>

              {/* User Profile */}
              <div className="hidden sm:block relative" ref={userDropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 bg-muted/50 hover:bg-muted px-3 py-2 rounded-xl transition-all border border-transparent hover:border-primary/20"
                >
                  <div className="w-9 h-9 bg-primary-gradient rounded-full flex items-center justify-center shadow-sm">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Hello,
                    </span>
                    <span className="text-sm font-semibold text-foreground leading-tight">
                      User {userId}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      showUserDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border overflow-hidden navbar-dropdown-enter z-50">
                    <Link
                      href="/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-4 py-3 hover:bg-primary/5 transition-colors text-foreground font-medium border-b border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span>My Profile</span>
                      </div>
                    </Link>

                    {/* Dev Tools - Only show in development */}
                    {process.env.NODE_ENV !== "production" && (
                      <div className="p-3 bg-accent/10 border-b border-border">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          Dev Tools
                        </label>
                        <select
                          value={
                            devUserId
                              ? `${devUserId}-${role}${
                                  storeId ? `-${storeId}` : ""
                                }`
                              : "4-USER"
                          }
                          onChange={(e) => {
                            try {
                              const target = e.target.value;
                              const parts = target.split("-");
                              const [newDevUserId, newRole, newStoreId] = parts;
                              localStorage.setItem("devUserId", newDevUserId);
                              localStorage.setItem("role", newRole);
                              localStorage.setItem("storeId", newStoreId ?? "");
                              window.location.reload();
                            } catch {}
                          }}
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="none">(none)</option>
                          <option value="1-SUPER_ADMIN">1 - SUPER_ADMIN</option>
                          <option value="2-STORE_ADMIN-1">
                            2 - STORE_ADMIN (Bandung)
                          </option>
                          <option value="3-STORE_ADMIN-2">
                            3 - STORE_ADMIN (Jakarta)
                          </option>
                          <option value="4-USER">4 - Normal User</option>
                          <option value="5-USER">5 - Normal User 5</option>
                        </select>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Switch users for testing
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Button */}
              <Link
                href="/cart"
                className="flex items-center gap-2.5 bg-primary-gradient hover:shadow-lg text-primary-foreground px-3 py-2 rounded-xl transition-all shadow-md group"
              >
                <div className="w-9 h-9 bg-primary-gradient rounded-full flex items-center justify-center shadow-sm">
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-primary-foreground group-hover:scale-110 transition-transform" />
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-bold shadow-sm">
                        {itemCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Admin Dashboard Button (Only for Admins) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden lg:flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/30 text-secondary-foreground px-3 py-2.5 rounded-xl transition-all shadow-sm hover:shadow"
                  title="Admin Dashboard"
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-semibold">Admin</span>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2.5 hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5 text-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-border py-4 mobile-menu-enter bg-gradient-to-b from-card to-muted/20">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="px-4 mb-4">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </form>

              {/* Mobile Categories */}
              <div className="px-4 mb-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                  Categories
                </h3>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-xl transition-all text-foreground group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-base">
                          {getCategoryIcon(cat.name)}
                        </span>
                      </div>
                      <span className="font-medium">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile User & Orders */}
              <div className="px-4 space-y-1 pt-2 border-t border-border">
                <Link
                  href="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-xl transition-all group"
                >
                  <div className="w-9 h-9 bg-primary-gradient rounded-full flex items-center justify-center shadow-sm">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      Account
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      User {userId}
                    </span>
                  </div>
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-xl transition-all"
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">
                    My Orders
                  </span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-xl transition-all"
                  >
                    <div className="w-9 h-9 bg-secondary/50 rounded-full flex items-center justify-center">
                      <Settings className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <span className="font-semibold text-foreground">
                      Admin Dashboard
                    </span>
                  </Link>
                )}

                {/* Mobile Dev Tools - Only show in development */}
                {process.env.NODE_ENV !== "production" && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Dev Tools
                      </label>
                      <select
                        value={
                          devUserId
                            ? `${devUserId}-${role}${
                                storeId ? `-${storeId}` : ""
                              }`
                            : "4-USER"
                        }
                        onChange={(e) => {
                          try {
                            const target = e.target.value;
                            const parts = target.split("-");
                            const [newDevUserId, newRole, newStoreId] = parts;
                            localStorage.setItem("devUserId", newDevUserId);
                            localStorage.setItem("role", newRole);
                            localStorage.setItem("storeId", newStoreId ?? "");
                            window.location.reload();
                          } catch {}
                        }}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="none">(none)</option>
                        <option value="1-SUPER_ADMIN">1 - SUPER_ADMIN</option>
                        <option value="2-STORE_ADMIN-1">
                          2 - STORE_ADMIN (Bandung)
                        </option>
                        <option value="3-STORE_ADMIN-2">
                          3 - STORE_ADMIN (Jakarta)
                        </option>
                        <option value="4-USER">4 - Normal User</option>
                        <option value="5-USER">5 - Normal User 5</option>
                      </select>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Switch users for testing
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Store Information Bar */}
      <div className="bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11">
            {/* Left: Delivering from Store */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Delivering from
                </span>
                <span className="text-sm font-bold text-primary">
                  {isMounted
                    ? nearestStoreName || "Store Bandung"
                    : "Store Bandung"}
                </span>
              </div>
            </div>

            {/* Right: Address Selection */}
            <div className="relative" ref={locationDropdownRef}>
              <button
                onClick={() =>
                  !isCheckoutPage &&
                  setShowLocationDropdown(!showLocationDropdown)
                }
                disabled={isCheckoutPage}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all border shadow-sm ${
                  isCheckoutPage
                    ? "bg-muted/50 border-border cursor-not-allowed opacity-60"
                    : "bg-card hover:bg-primary/5 border-border hover:border-primary/30 hover:shadow group"
                }`}
              >
                <MapPin
                  className={`h-4 w-4 transition-transform ${
                    isCheckoutPage
                      ? "text-muted-foreground"
                      : "text-primary group-hover:scale-110"
                  }`}
                />
                <span
                  className={`text-sm font-semibold max-w-[200px] truncate ${
                    isCheckoutPage ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {isMounted
                    ? activeAddress?.addressLine || "Select Address"
                    : "Select Address"}
                </span>
                {!isCheckoutPage && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                      showLocationDropdown ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Location Dropdown */}
              {showLocationDropdown && (
                <div className="absolute top-full right-0 mt-2 w-[420px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-50 navbar-dropdown-enter">
                  <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                    <h3 className="font-bold text-foreground mb-1.5 text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Select Delivery Address
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Choose your location to see products from nearby stores
                    </p>
                  </div>
                  <div className="p-4 max-h-[420px] overflow-y-auto scrollbar-hide">
                    <LocationManager userId={userId} />
                  </div>
                  <div className="p-4 border-t border-border bg-muted/20">
                    <button
                      onClick={() => setShowLocationDropdown(false)}
                      className="w-full px-4 py-2.5 bg-primary-gradient text-primary-foreground rounded-xl hover:shadow-lg transition-all font-semibold text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
