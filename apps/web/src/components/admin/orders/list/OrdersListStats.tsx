import { Users, ShoppingBag, DollarSign } from "lucide-react";

interface OrderStats {
  totalCustomers: number;
  totalTransactions: number;
  totalRevenue: number;
}

interface OrdersListStatsProps {
  stats: OrderStats;
  selectedCount: number;
}

export default function OrdersListStats({
  stats,
  selectedCount,
}: OrdersListStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      <div
        className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
          selectedCount > 0 ? "ring-2 ring-primary" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-1">
              Total Customers
              {selectedCount > 0 && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Selected
                </span>
              )}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {stats.totalCustomers}
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${
              selectedCount > 0 ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <Users
              className={`w-6 h-6 ${
                selectedCount > 0 ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
        </div>
      </div>

      <div
        className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
          selectedCount > 0 ? "ring-2 ring-primary" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-1">
              Total Transactions
              {selectedCount > 0 && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Selected
                </span>
              )}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {stats.totalTransactions}
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${
              selectedCount > 0 ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <ShoppingBag
              className={`w-6 h-6 ${
                selectedCount > 0 ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
        </div>
      </div>

      <div
        className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
          selectedCount > 0 ? "ring-2 ring-primary" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-1">
              Revenue
              {selectedCount > 0 && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Selected
                </span>
              )}
            </p>
            <p className="text-3xl font-bold text-foreground">
              Rp{(stats.totalRevenue / 1000).toFixed(0)}k
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${
              selectedCount > 0 ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <DollarSign
              className={`w-6 h-6 ${
                selectedCount > 0 ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
