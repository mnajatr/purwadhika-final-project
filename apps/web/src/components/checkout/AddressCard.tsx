"use client";

import React from "react";

export default function AddressCard() {
  return (
    <section className="bg-white border rounded-lg p-0 mb-6 shadow-sm overflow-hidden">
      <div className="bg-rose-50 p-4 flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-rose-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10l1.5-2 3 4 4-6 6 8"
          />
        </svg>
        <div>
          <div className="text-sm font-semibold">Delivery Address</div>
          <div className="text-xs text-muted-foreground">Default • Home</div>
        </div>
      </div>
      <div className="p-4 text-sm text-muted-foreground">
        <div className="font-medium">Zahra Ayu</div>
        <div>cengkareng</div>
        <div>Jakarta Barat, 11220</div>
        <div className="mt-2 text-sm">
          Leave package at the front desk if not home.
        </div>
      </div>
    </section>
  );
}
