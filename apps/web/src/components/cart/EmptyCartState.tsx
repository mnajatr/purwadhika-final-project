import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export function EmptyCartState() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="text-center max-w-md mx-auto px-6 relative z-10">
        {/* Shopping Cart Icon - Using consistent design pattern */}
        <div className="flex justify-center mb-8 relative">
          <div className="bg-primary/10 p-4 rounded-3xl">
            <div className="bg-primary/20 p-4 rounded-2xl">
              <ShoppingCart className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          {/* Cute star decorations */}
          <div className="absolute -top-2 -right-2 w-4 h-4 text-primary/60">
            ⭐
          </div>
          <div className="absolute -bottom-1 -left-3 w-3 h-3 text-primary/40">
            ✨
          </div>
        </div>

        {/* Main Heading - Matching landing page typography */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Your cart is empty
        </h1>

        {/* Subtitle - Using muted foreground */}
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Discover fresh groceries and household essentials. Start shopping now!
        </p>

        {/* Call to Action Button - Using consistent gradient */}
        <Button
          size="lg"
          className="bg-primary-gradient hover:opacity-95 text-primary-foreground px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          onClick={() => router.push("/products")}
        >
          Start Shopping
        </Button>
      </div>

      {/* Background star decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-primary/20 text-2xl">⭐</div>
        <div className="absolute top-1/3 right-1/3 text-primary/15 text-lg">✨</div>
        <div className="absolute bottom-1/4 left-1/3 text-primary/25 text-xl">🌟</div>
        <div className="absolute bottom-1/3 right-1/4 text-primary/10 text-sm">⭐</div>
        <div className="absolute top-1/5 right-1/5 text-primary/20 text-base">✨</div>
      </div>
    </div>
  );
}