"use client";

import { ShoppingBag } from "lucide-react";

export default function OrdersListLoading() {
  return (
    <div className="min-h-screen">
      <div className="relative border-b border-border/40 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-gradient shadow-lg shadow-primary/20">
                  <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Your Orders
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage and track your orders
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-36 bg-gradient-to-br from-card/80 to-card/40 rounded-2xl animate-pulse border border-border/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
