"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProduct";
import useLocationStore from "@/stores/locationStore";
import Hero from "@/components/Hero";

export default function Home() {
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId);

  const { data } = useProducts(1, nearestStoreId ?? undefined); //1 page

  const products = data?.products || [];
  const nearestStore = data?.nearestStore || null;

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

  const visibleProducts = products.filter((p) => p.isActive !== false);

  const featuredProducts = visibleProducts.slice(0, 6);

  return (
    <div className="min-h-screen">

      <Hero />

      {/* Featured Products Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="relative container mx-auto px-4 py-20">
          {featuredProducts.length > 0 && (
            <div className="space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  Featured Products
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {featuredProducts.length} fresh items available
                  {nearestStore && (
                    <span className="text-primary font-semibold">
                      {" "}
                      from {nearestStore.name}
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.map((product, index) => {
                  const outOfStock = product.stock === 0;
                  return (
                    <div
                      key={index + 1}
                      className={`group relative bg-card/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden flex flex-col transition-all duration-500 border border-border/50 ${
                        outOfStock
                          ? "opacity-60 grayscale"
                          : "hover:shadow-2xl hover:-translate-y-2 hover:border-primary/40"
                      }`}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      
                      {/* Image section */}
                      <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className={`object-cover transition-transform duration-700 ${
                            outOfStock ? "" : "group-hover:scale-110"
                          }`}
                        />
                        {outOfStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="bg-red-500/90 backdrop-blur-sm px-6 py-3 rounded-2xl">
                              <p className="text-white font-bold text-lg">Out of Stock</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Stock badge */}
                        {!outOfStock && (
                          <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/20">
                            <p className="text-xs font-semibold text-primary">
                              {product.stock} available
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Content section */}
                      <div className="relative p-6 flex flex-col flex-grow space-y-4">
                        {/* Category badge */}
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-full font-semibold border border-primary/20">
                            {product.category}
                          </span>
                          {product.store && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {product.store}
                            </span>
                          )}
                        </div>

                        {/* Product name */}
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm line-clamp-2 flex-grow leading-relaxed">
                          {product.description}
                        </p>

                        {/* Price */}
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Price</p>
                          <p
                            className="text-3xl font-bold"
                            style={{
                              background: "linear-gradient(90deg, var(--prim-start), var(--prim-end))",
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              color: "transparent",
                            }}
                          >
                            Rp {Number(product.price || 0).toLocaleString("id-ID")}
                          </p>
                        </div>

                        {/* CTA Button */}
                        <Link
                          href={outOfStock ? "#" : `/products/${product.slug}`}
                          className={`block text-center py-3 px-6 rounded-2xl font-semibold transition-all shadow-lg mt-4 ${
                            outOfStock
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-primary-gradient text-primary-foreground hover:opacity-90 hover:shadow-xl hover:scale-105"
                          }`}
                          onClick={(e) => outOfStock && e.preventDefault()}
                        >
                          {outOfStock ? "Out Of Stock" : "View Product"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center pt-8">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm hover:bg-card text-foreground px-8 py-4 rounded-2xl transition-all font-semibold border border-border/50 hover:border-primary/30 shadow-lg"
                >
                  View All Products
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div className="relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-prim-end/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-prim-start/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Shop by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find exactly what you need, from fresh fruits to daily essentials
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Fruits",
                icon: "🍎",
                gradient: "from-red-400/20 to-orange-400/20",
                iconBg: "from-red-400 to-orange-400",
              },
              {
                name: "Vegetables",
                icon: "🥕",
                gradient: "from-green-400/20 to-emerald-400/20",
                iconBg: "from-green-400 to-emerald-400",
              },
              {
                name: "Fast food",
                icon: "🍔",
                gradient: "from-yellow-400/20 to-orange-400/20",
                iconBg: "from-yellow-400 to-orange-400",
              },
              {
                name: "Dairy",
                icon: "🥛",
                gradient: "from-blue-400/20 to-cyan-400/20",
                iconBg: "from-blue-400 to-cyan-400",
              },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${category.name.toLowerCase()}`}
                className="group"
              >
                <div className={`bg-gradient-to-br ${category.gradient} backdrop-blur-sm rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-border/30 hover:border-primary/30`}>
                  <div
                    className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.iconBg} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    {category.icon}
                  </div>
                  <h3 className="font-bold text-foreground text-lg">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "⏰",
                title: "Fast Delivery",
                description:
                  "Quick and reliable delivery to your doorstep within hours. Track your order in real-time.",
                gradient: "from-orange-500/10 to-red-500/10",
              },
              {
                icon: "✅",
                title: "Fresh Quality",
                description:
                  "Hand-picked fresh products from trusted local suppliers. Quality guaranteed or your money back.",
                gradient: "from-green-500/10 to-emerald-500/10",
              },
              {
                icon: "💰",
                title: "Best Prices",
                description:
                  "Competitive prices with regular discounts and exclusive member offers.",
                gradient: "from-blue-500/10 to-cyan-500/10",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm p-8 rounded-3xl text-center shadow-lg border border-border/30 hover:border-primary/30 transition-all hover:shadow-xl group`}
              >
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-prim-start/20 via-primary/10 to-prim-end/20" />
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-12 md:p-16 text-center border border-primary/20 shadow-2xl">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Ready to Start Shopping?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Browse through our collection of fresh groceries and household
                essentials. Get everything delivered fresh to your doorstep today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 bg-primary-gradient hover:opacity-90 text-primary-foreground px-10 py-4 rounded-2xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Explore Products
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
