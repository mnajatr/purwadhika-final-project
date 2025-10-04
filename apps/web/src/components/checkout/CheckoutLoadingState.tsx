"use client";

import { Spinner } from "@/components/ui/spinner";

export function CheckoutLoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-sm p-8 text-center"
      >
        {/* Outer animated ring */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          {/* Rotating gradient background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-secondary to-primary animate-spin opacity-20 blur-sm"></div>

          {/* Main container */}
          <div className="relative w-28 h-28 rounded-full shadow-2xl bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-primary/10 animate-pulse">
            {/* Inner glow effect */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary/5 to-secondary/5 shadow-inner">
              {/* Spinner container */}
              <div className="w-full h-full flex items-center justify-center bg-card/90 rounded-full backdrop-blur-sm border border-white/20">
                <Spinner
                  variant="ring"
                  size={84}
                  className="text-primary drop-shadow-lg"
                />
              </div>
            </div>

            {/* Floating dots */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-bounce shadow-lg"></div>
            <div
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-secondary rounded-full animate-bounce shadow-lg"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>

          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping"></div>
          <div
            className="absolute inset-4 rounded-full border border-secondary/20 animate-ping"
            style={{ animationDelay: "0.3s" }}
          ></div>
        </div>

        <span className="sr-only">Loading checkout</span>
      </div>
    </div>
  );
}
