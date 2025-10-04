import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

interface OrdersListFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  onDateRangeChange: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
  storeIdFilter: number | undefined;
  onStoreIdChange: (value: number | undefined) => void;
  stores: Array<{ id: number; name: string }>;
  userRole: string | undefined;
  onClearFilters: () => void;
  onRefresh: () => void;
  onPageReset: () => void;
}

export default function OrdersListFilters({
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  storeIdFilter,
  onStoreIdChange,
  stores,
  userRole,
  onClearFilters,
  onRefresh,
  onPageReset,
}: OrdersListFiltersProps) {
  return (
    <div className="mb-6 bg-card border border-border p-4 rounded-xl shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status Filter
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAYMENT_REVIEW">Payment Review</option>
            <option value="PROCESSING">Processing</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Date Range
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal border-border rounded-lg hover:bg-accent hover:text-accent-foreground ${
                  !dateRange.from && "text-muted-foreground"
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {dateRange.from ? (
                    dateRange.to ? (
                      dateRange.from.getTime() === dateRange.to.getTime() ? (
                        format(dateRange.from, "PPP")
                      ) : (
                        <>
                          {format(dateRange.from, "MMM dd")} -{" "}
                          {format(dateRange.to, "MMM dd, yyyy")}
                        </>
                      )
                    ) : (
                      format(dateRange.from, "PPP")
                    )
                  ) : (
                    "Pick date range"
                  )}
                </span>
                {(dateRange.from || dateRange.to) && (
                  <X
                    className="ml-auto h-4 w-4 flex-shrink-0 opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateRangeChange({ from: undefined, to: undefined });
                      onPageReset();
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-2xl border-border shadow-lg bg-popover"
              align="start"
            >
              <div className="p-4 space-y-3">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                    onDateRangeChange({
                      from: range?.from,
                      to: range?.to,
                    });
                    onPageReset();
                  }}
                  initialFocus
                  className="rounded-lg"
                  numberOfMonths={1}
                />
                {(dateRange.from || dateRange.to) && (
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onDateRangeChange({ from: undefined, to: undefined });
                        onPageReset();
                      }}
                      className="flex-1 rounded-lg"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        onDateRangeChange({ from: today, to: today });
                        onPageReset();
                      }}
                      className="flex-1 rounded-lg bg-primary hover:opacity-90 text-primary-foreground"
                    >
                      Today
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {userRole === "SUPER_ADMIN" && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Store
            </label>
            <select
              value={storeIdFilter ?? ""}
              onChange={(e) =>
                onStoreIdChange(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              <option value="">All stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium transition-opacity"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
