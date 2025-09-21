"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useProducts } from "@/hooks/useProduct";
import useLocationStore from "@/stores/locationStore";
import NearestStoreIndicator from "@/components/products/NearestStoreIndicator";
import dynamic from "next/dynamic";

const AddressPicker = dynamic(() => import("@/components/AddressPicker"), { ssr: false });

export default function Home() {
  // Location from global store (address picker)
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId);

  // Fetch products by nearest store id (preferred)
  const { data } = useProducts(nearestStoreId ?? undefined);

  const products = data?.products || [];
  const nearestStore = data?.nearestStore || null;
  const storeMessage = data?.message || "Loading...";

  React.useEffect(() => {
    try {
      console.debug("Home: nearestStoreId from store:", nearestStoreId, "products fetched:", data);
    } catch {}
  }, [nearestStoreId, data]);

  // Only show products that are active. Treat undefined as active.
  const visibleProducts = products.filter((p) => p.isActive !== false);

  // Show all visible products on the landing page (use product list card design)
  const featuredProducts = visibleProducts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Grocery Store
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Fresh groceries delivered to your doorstep. Browse our wide
            selection of quality products and enjoy convenient shopping.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/products"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/cart"
              className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              View Cart
            </Link>
          </div>
        </div>

        {/* Address picker and Nearest Store Section */}
        <div className="mb-16">
          <NearestStoreIndicator nearestStore={nearestStore} message={storeMessage} />
            <div className="mt-6">
              <AddressPicker />
            </div>
        </div>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Products
                {nearestStore && (
                  <span className="text-lg font-normal text-gray-600 block">
                    from {nearestStore.name}
                  </span>
                )}
              </h2>
              <p className="text-gray-600">
                Check out our popular items available near you
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col"
                >
                  <div className="relative w-full h-48">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
                    <p className="text-indigo-600 font-bold mb-3">Rp {Number(product.price || 0).toLocaleString("id-ID")}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">{product.category}</span>
                      <span className="text-xs text-gray-500">{product.store}</span>
                    </div>
                    <Link href={`/products/${product.slug}`} className="block text-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition mt-auto">Lihat Detail</Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link
                href="/products"
                className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                View All Products
              </Link>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">
              Quick and reliable delivery to your doorstep within hours.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Fresh Quality</h3>
            <p className="text-gray-600">
              Hand-picked fresh products from trusted suppliers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
            <p className="text-gray-600">
              Competitive prices with regular discounts and offers.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-gray-600 mb-6">
            Browse through our collection of fresh groceries and household
            essentials.
          </p>
          <Link
            href="/products"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Explore Products
          </Link>
        </div>
      </div>
    </div>
  );
}
