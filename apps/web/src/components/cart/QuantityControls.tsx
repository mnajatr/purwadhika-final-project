"use client";

import React from "react";
import { PlusIcon, MinusIcon } from "./CartItemIcons";

interface QuantityControlsProps {
  currentQty: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
  maxReached?: boolean;
}

export default function QuantityControls({
  currentQty,
  onDecrease,
  onIncrease,
  disabled = false,
  maxReached = false,
}: QuantityControlsProps) {
  return (
    <div className="flex items-center flex-shrink-0 mt-2 sm:mt-0">
      {/* Pill container */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-[color:var(--muted)]/60"
        style={{ backgroundColor: "var(--muted)" }}
      >
        {/* Decrease button: subtle circular */}
        <button
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white flex items-center justify-center transition-all duration-150 border border-[color:var(--muted)]/40 disabled:opacity-50"
          onClick={onDecrease}
          disabled={disabled}
          aria-label="Decrease quantity"
          style={{ color: "var(--foreground)" }}
        >
          <MinusIcon className="w-3.5 h-3.5 stroke-3" />
        </button>

        {/* Quantity display */}
        <span className="min-w-[28px] text-center font-semibold text-lg text-foreground">
          {currentQty}
        </span>

        {/* Increase button: primary orange circular using CSS variable */}
        <button
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-50`}
          onClick={onIncrease}
          disabled={disabled || maxReached}
          aria-label="Increase quantity"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <PlusIcon className="w-4 h-4 stroke-2" />
        </button>
      </div>
    </div>
  );
}
