"use client";

import React from "react";
import { Check, Sparkles, Heart } from "lucide-react";

interface OrderSuccessModalProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function OrderSuccessModal({
  isVisible,
  onComplete,
}: OrderSuccessModalProps) {
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      // Auto-complete after 2 seconds
      const timer = setTimeout(() => {
        setIsRedirecting(true);
        // Trigger redirect but keep modal visible
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  // Keep modal visible during page transition
  React.useEffect(() => {
    if (isVisible) {
      // Prevent modal from disappearing during navigation
      const handleBeforeUnload = () => {
        // Modal will naturally disappear when page unloads
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with gradient - changes during redirect */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ${
          isRedirecting
            ? "bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 dark:from-lime-950 dark:via-green-950 dark:to-emerald-950"
            : "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950"
        }`}
      >
        {/* Custom background with theme color */}
        {isRedirecting && (
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundColor: "#ebf9c8" }}
          ></div>
        )}
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-20">
          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-orange-300 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}

          {/* Larger floating elements */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`large-${i}`}
              className="absolute w-4 h-4 bg-yellow-200 rounded-full animate-pulse opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-md mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        {/* Success icon with multiple animation layers */}
        <div className="relative mx-auto w-32 h-32 mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-orange-200 animate-spin opacity-30"></div>

          {/* Middle pulsing ring */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-orange-300 to-yellow-300 animate-pulse opacity-40"></div>

          {/* Inner container */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 shadow-2xl flex items-center justify-center animate-bounce">
            {/* Success icon */}
            <div className="relative">
              <Check
                className="w-12 h-12 text-white drop-shadow-lg"
                strokeWidth={3}
              />

              {/* Sparkle effects */}
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-200 animate-pulse" />
              <Heart
                className="absolute -bottom-1 -left-2 w-4 h-4 text-orange-200 animate-bounce"
                style={{ animationDelay: "0.5s" }}
              />
            </div>
          </div>

          {/* Expanding success rings */}
          <div className="absolute inset-0 rounded-full border-2 border-orange-300 animate-ping opacity-75"></div>
          <div
            className="absolute inset-2 rounded-full border-2 border-yellow-300 animate-ping opacity-50"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        {/* Success text */}
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 delay-300">
          <h1
            className={`text-3xl md:text-4xl font-bold transition-colors duration-1000 ${
              isRedirecting
                ? "text-lime-800 dark:text-lime-100"
                : "text-gray-800 dark:text-gray-100"
            }`}
          >
            {isRedirecting
              ? "Preparing Your Order..."
              : "Order Placed Successfully"}
          </h1>

          <p
            className={`text-lg leading-relaxed transition-colors duration-1000 ${
              isRedirecting
                ? "text-lime-700 dark:text-lime-300"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            {isRedirecting ? (
              <>
                Taking you to your order details
                <br />
                Please wait a moment...
              </>
            ) : (
              <>
                Thank you for placing an order. We are glad
                <br />
                to serve you on your journey.
              </>
            )}
          </p>
        </div>

        {/* Loading indicator */}
        <div className="mt-8 animate-in fade-in-0 duration-1000 delay-700">
          <div
            className={`flex items-center justify-center space-x-2 transition-colors duration-1000 ${
              isRedirecting
                ? "text-lime-600 dark:text-lime-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p
            className={`text-sm mt-2 transition-colors duration-1000 ${
              isRedirecting
                ? "text-lime-600 dark:text-lime-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {isRedirecting
              ? "Opening your order details..."
              : "Redirecting to your order..."}
          </p>

          {/* Additional loading bar during redirect */}
          {isRedirecting && (
            <div className="mt-4 w-48 h-1 bg-lime-200 dark:bg-lime-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-lime-500 dark:bg-lime-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
