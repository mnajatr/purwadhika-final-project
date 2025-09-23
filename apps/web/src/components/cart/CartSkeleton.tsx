import { Skeleton } from "@/components/ui/skeleton";

export function CartItemSkeleton() {
  return (
    <div className="flex items-start sm:items-center gap-4">
      {/* Checkbox skeleton */}
      <div className="flex items-center justify-center self-center sm:self-auto">
        <Skeleton className="h-6 w-6 rounded-sm" />
      </div>

      {/* Card Container */}
      <div className="relative bg-card rounded-2xl p-3 sm:p-4 shadow-sm border border-border flex-1 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Product Image Skeleton */}
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl flex-shrink-0" />

          {/* Product Details Skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Category Badge */}
            <Skeleton className="h-5 w-16 rounded-full" />

            {/* Product Name */}
            <Skeleton className="h-6 w-3/4" />

            {/* Price */}
            <Skeleton className="h-4 w-20" />

            {/* Stock warning area */}
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Total Price Skeleton */}
          <div className="text-center flex-shrink-0 mt-2 sm:mt-0 sm:ml-2">
            <Skeleton className="h-6 w-20" />
          </div>

          {/* Quantity Controls Skeleton */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Main Cart Content */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm backdrop-blur-sm">
            {/* Select All Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-sm" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>

            {/* Cart Items Skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <CartItemSkeleton key={index} />
              ))}
            </div>

            {/* Clear Cart Button Skeleton */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex w-full items-center justify-end">
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>

          {/* Checkout Sidebar Skeleton */}
          <div className="w-full lg:w-auto">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg backdrop-blur-sm lg:sticky lg:top-6">
              <Skeleton className="h-7 w-32 mb-6" />

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex justify-between items-center py-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </div>

              <Skeleton className="w-full h-14 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}
