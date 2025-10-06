import { Search, Filter } from "lucide-react";

interface OrdersListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
}

export default function OrdersListHeader({
  searchQuery,
  onSearchChange,
  selectedCount,
}: OrdersListHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-foreground">Order List</h1>
            {selectedCount > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {selectedCount} selected
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground w-64"
            />
          </div>
          <button className="px-4 py-2 border border-border rounded-lg flex items-center space-x-2 bg-primary hover:bg-accent text-white hover:text-accent-foreground transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
