"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useProducts } from "@/hooks/useProduct";
import useLocationStore from "@/stores/locationStore";
import NearestStoreIndicator from "@/components/products/NearestStoreIndicator";
import dynamic from "next/dynamic";

const AddressPicker = dynamic(() => import("@/components/AddressPicker"), {
  ssr: false,
});

export default function Home() {
  // Location from global store (address picker)
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId);

  // Fetch products by nearest store id (preferred)
  const { data } = useProducts(1, nearestStoreId ?? undefined); //1 page

  const products = data?.products || [];
  const nearestStore = data?.nearestStore || null;
  const storeMessage = data?.message || "Loading...";

  React.useEffect(() => {
    try {
      console.debug(
        "Home: nearestStoreId from store:",
        nearestStoreId,
        "products fetched:",
        data
      );
    } catch {}
  }, [nearestStoreId, data]);

  // Only show products that are active. Treat undefined as active.
  const visibleProducts = products.filter((p) => p.isActive !== false);

  // Show featured products on the landing page
  const featuredProducts = visibleProducts.slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-4 rounded-3xl">
                <div className="bg-primary/20 p-4 rounded-2xl">
                  <svg
                    className="w-12 h-12 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Growseries
              <span className="block text-primary">Fresh & Fast</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The easiest way to buy your grocery shopping. Fresh produce
              delivered to your doorstep within hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/products"
                className="bg-primary-gradient hover:opacity-95 text-primary-foreground px-8 py-4 rounded-2xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started
              </Link>
              <Link
                href="/cart"
                className="bg-primary-gradient hover:opacity-95 text-primary-foreground px-8 py-4 rounded-2xl text-lg font-semibold transition-all"
              >
                View Cart
              </Link>
            </div>
          </div>

          {/* Address picker and Nearest Store Section */}
          <div className="mb-16 max-w-4xl mx-auto">
            <div className="bg-card rounded-3xl p-8 shadow-lg border border-border">
              <NearestStoreIndicator
                nearestStore={nearestStore}
                message={storeMessage}
              />
              <div className="mt-6">
                <AddressPicker />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="container mx-auto px-4">
        {featuredProducts.length > 0 && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Found more
                <span className="block text-2xl font-normal text-muted-foreground">
                  {featuredProducts.length} fresh items
                  {nearestStore && ` from ${nearestStore.name}`}
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredProducts.map((product, index) => (
                <div
                  key={index + 1}
                  className="bg-card rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-border"
                >
                  <div className="relative w-full h-48 bg-gradient-to-br from-primary/5 to-primary/10">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                        ⭐ 4.5
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block px-3 py-1 text-xs bg-primary/25 text-primary rounded-full font-medium">
                        {product.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.store}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-primary">
                          Rp{" "}
                          {Number(product.price || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <Link
                        href={`/products/${product.slug}`}
                        className="bg-primary-gradient hover:opacity-95 text-primary-foreground px-6 py-2 rounded-xl transition-all font-semibold"
                      >
                        Product Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link
                href="/products"
                className="inline-block bg-secondary hover:bg-secondary/80 text-secondary-foreground px-8 py-3 rounded-2xl transition-all font-semibold"
              >
                View All Products
              </Link>
            </div>
          </div>
        )}

        {/* Categories Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground text-lg">
              Find what you need quickly
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Fruits",
                icon: "🍎",
                color: "from-red-400 to-orange-400",
              },
              {
                name: "Vegetables",
                icon: "🥕",
                color: "from-green-400 to-emerald-400",
              },
              {
                name: "Fast food",
                icon: "🍔",
                color: "from-yellow-400 to-orange-400",
              },
              { name: "Dairy", icon: "🥛", color: "from-blue-400 to-cyan-400" },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${category.name.toLowerCase()}`}
                className="group"
              >
                <div className="bg-card rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-border">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}
                  >
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: "⏰",
              title: "Fast Delivery",
              description:
                "Quick and reliable delivery to your doorstep within hours.",
            },
            {
              icon: "✅",
              title: "Fresh Quality",
              description: "Hand-picked fresh products from trusted suppliers.",
            },
            {
              icon: "💰",
              title: "Best Prices",
              description:
                "Competitive prices with regular discounts and offers.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-card p-8 rounded-3xl text-center shadow-lg border border-border"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-12 text-center border border-primary/20">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
            Browse through our collection of fresh groceries and household
            essentials. Get everything delivered fresh to your doorstep.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-gradient hover:opacity-95 text-primary-foreground px-10 py-4 rounded-2xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Explore Products
          </Link>
        </div>
      </div>
    </div>
  );
}
