"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

interface OrdersListErrorProps {
  error: Error | null;
}

export default function OrdersListError({ error }: OrdersListErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="p-4 rounded-full bg-rose-100/80 dark:bg-rose-900/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-rose-600 dark:text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          {error instanceof Error
            ? error.message
            : "Failed to load your orders. Please try again."}
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-primary-gradient hover:opacity-90 shadow-lg shadow-primary/25"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
