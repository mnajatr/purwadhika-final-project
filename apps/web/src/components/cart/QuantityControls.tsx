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
    <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
      <button
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors duration-200"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </button>

      <span className="w-6 text-center font-semibold text-base text-gray-900">{currentQty}</span>

      <button
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-colors duration-200"
        onClick={onIncrease}
        disabled={disabled || maxReached}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
