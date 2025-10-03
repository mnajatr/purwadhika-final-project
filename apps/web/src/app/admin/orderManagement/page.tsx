"use client";

import Sidebar from "@/components/admin/sidebar";
import { useState, useEffect, useMemo } from "react";
import { useOrders } from "@/hooks/useOrders";
import { adminOrdersService as ordersService } from "@/services/adminOrders.service";
import { storesService } from "@/services/stores.service";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  Users,
  ShoppingBag,
  DollarSign,
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  Truck,
  XCircle,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

type Order = {
  id: number;
  userId: number;
  storeId: number;
  status: string;
  grandTotal: number;
  totalItems: number;
  createdAt: string;
  paymentMethod: string;
  payment?: {
    id: number;
    status: string;
    proofImageUrl?: string;
    reviewedAt?: string;
  };
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    totalAmount: number;
    product: {
      id: number;
      name: string;
      price: string;
    };
  }>;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  store?: {
    id: number;
    name: string;
  };
};

type OrderStats = {
  totalCustomers: number;
  totalTransactions: number;
  totalRevenue: number;
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [storeIdFilter, setStoreIdFilter] = useState<number | undefined>(
    undefined
  );
  const pageSize = 10;
  const {
    items: rawItems,
    loading,
    error,
    reload,
    meta,
  } = useOrders({
    page,
    pageSize,
    status: status || undefined,
    q: searchQuery || undefined,
    storeId: storeIdFilter,
    from: dateRange.from,
    to: dateRange.to,
  });

  // Apply client-side date filtering to items if backend doesn't support it
  const items = useMemo(() => {
    if (!dateRange.from && !dateRange.to) {
      return rawItems;
    }

    const orderItems = rawItems as unknown as Order[];
    return orderItems.filter((order) => {
      const orderDate = new Date(order.createdAt);

      let from = null;
      let to = null;

      if (dateRange.from) {
        from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
      }

      if (dateRange.to) {
        to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
      }

      if (from && to) {
        return orderDate >= from && orderDate <= to;
      } else if (from) {
        return orderDate >= from;
      } else if (to) {
        return orderDate <= to;
      }
      return true;
    });
  }, [rawItems, dateRange.from, dateRange.to]);

  const [stores, setStores] = useState<Array<{ id: number; name: string }>>([]);
  const [profile, setProfile] = useState<{
    id: number;
    role: string;
    storeId?: number | null;
  } | null>(null);
  const [devUserId, setDevUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [allOrdersStats, setAllOrdersStats] = useState<OrderStats>({
    totalCustomers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: number | null;
    action: "confirm" | "ship" | "cancel" | null;
    title: string;
    description: string;
    variant: "default" | "destructive" | "warning";
  }>({
    open: false,
    orderId: null,
    action: null,
    title: "",
    description: "",
    variant: "default",
  });

  // Clear selected orders when filters change
  useEffect(() => {
    setSelectedOrders(new Set());
  }, [status, searchQuery, storeIdFilter, dateRange.from, dateRange.to, page]);

  // Fetch ALL orders stats (without pagination) for the statistics cards
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Fetch all orders with same filters but high pageSize to get all data
        const allData = await ordersService.getOrders({
          page: 1,
          pageSize: 10000, // Large number to get all orders
          status: status || undefined,
          q: searchQuery || undefined,
          storeId: storeIdFilter,
          from: dateRange.from,
          to: dateRange.to,
        });

        if (mounted && allData.items) {
          let allOrders = allData.items as unknown as Order[];

          // Apply client-side date filtering as backup if backend doesn't support it
          if (dateRange.from || dateRange.to) {
            allOrders = allOrders.filter((order) => {
              const orderDate = new Date(order.createdAt);

              let from = null;
              let to = null;

              if (dateRange.from) {
                from = new Date(dateRange.from);
                from.setHours(0, 0, 0, 0);
              }

              if (dateRange.to) {
                to = new Date(dateRange.to);
                to.setHours(23, 59, 59, 999);
              }

              if (from && to) {
                return orderDate >= from && orderDate <= to;
              } else if (from) {
                return orderDate >= from;
              } else if (to) {
                return orderDate <= to;
              }
              return true;
            });
          }

          const uniqueCustomers = new Set(allOrders.map((item) => item.userId))
            .size;
          const totalRev = allOrders.reduce(
            (sum, item) => sum + item.grandTotal,
            0
          );

          setAllOrdersStats({
            totalCustomers: uniqueCustomers,
            totalTransactions: allOrders.length,
            totalRevenue: totalRev,
          });
        }
      } catch (error) {
        console.error("Failed to fetch all orders stats:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [status, searchQuery, storeIdFilter, dateRange.from, dateRange.to]);

  // Calculate stats - if there are selected orders, show stats for selected only, otherwise show all orders stats
  const stats = useMemo<OrderStats>(() => {
    // If some orders are selected, calculate stats only for selected orders
    if (selectedOrders.size > 0 && items && items.length > 0) {
      const orderItems = items as unknown as Order[];
      const ordersToCalculate = orderItems.filter((order) =>
        selectedOrders.has(order.id)
      );

      if (ordersToCalculate.length === 0) {
        return allOrdersStats;
      }

      const uniqueCustomers = new Set(
        ordersToCalculate.map((item) => item.userId)
      ).size;
      const totalRev = ordersToCalculate.reduce(
        (sum, item) => sum + item.grandTotal,
        0
      );

      return {
        totalCustomers: uniqueCustomers,
        totalTransactions: ordersToCalculate.length,
        totalRevenue: totalRev,
      };
    }

    // No selection - return all orders stats
    return allOrdersStats;
  }, [items, selectedOrders, allOrdersStats]);

  // read devUserId from localStorage on client (useEffect avoids setting state during render)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setDevUserId(localStorage.getItem("devUserId"));
    } catch {
      setDevUserId(null);
    }
  }, []);

  // Fetch stores for super_admin to filter by
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storeList, profileResp] = await Promise.all([
          storesService.list(),
          storesService.getProfile().catch(() => null),
        ]);
        if (mounted) {
          setStores(storeList);
          setProfile(profileResp ?? null);
          // if current profile is store admin, default the store filter to their store
          if (
            profileResp &&
            profileResp.role === "STORE_ADMIN" &&
            profileResp.storeId
          ) {
            setStoreIdFilter(profileResp.storeId);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isLikelyNonAdmin =
    devUserId === null || devUserId === "none" || devUserId === "4";

  const handleOrderAction = async (
    orderId: number,
    action: "confirm" | "ship" | "cancel"
  ) => {
    // Confirmation dialog
    const actionNames = {
      confirm: "Confirm Payment",
      ship: "Ship Order",
      cancel: "Cancel Order",
    };

    const actionDescriptions = {
      confirm: `This will mark the payment as confirmed for order #${orderId}. The order will move to processing status.`,
      ship: `This will mark order #${orderId} as shipped. The customer will be notified.`,
      cancel: `This will cancel order #${orderId}. This action cannot be undone.`,
    };

    const actionVariants = {
      confirm: "default" as const,
      ship: "default" as const,
      cancel: "destructive" as const,
    };

    setConfirmDialog({
      open: true,
      orderId,
      action,
      title: actionNames[action],
      description: actionDescriptions[action],
      variant: actionVariants[action],
    });
  };

  const executeOrderAction = async () => {
    if (!confirmDialog.orderId || !confirmDialog.action) return;

    const orderId = confirmDialog.orderId;
    const action = confirmDialog.action;
    const actionKey = `${orderId}-${action}`;

    const actionNames = {
      confirm: "confirm payment",
      ship: "ship",
      cancel: "cancel",
    };

    setConfirmDialog({
      open: false,
      orderId: null,
      action: null,
      title: "",
      description: "",
      variant: "default",
    });
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      await ordersService.updateOrderStatus(orderId, action);
      alert(`Order #${orderId} ${actionNames[action]}ed successfully!`);
      reload(); // Refresh the list
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      alert(`Failed to ${actionNames[action]} order: ${message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20";
      case "PROCESSING":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
      case "PAYMENT_REVIEW":
        return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20";
      case "CONFIRMED":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20";
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const canConfirmPayment = (order: Order) => {
    return (
      order.status === "PAYMENT_REVIEW" && order.payment?.status === "PENDING"
    );
  };

  const canShip = (order: Order) => {
    return order.status === "PROCESSING";
  };

  const canCancel = (order: Order) => {
    return ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PROCESSING"].includes(
      order.status
    );
  };

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allOrderIds = new Set(
        (items as unknown as Order[]).map((order) => order.id)
      );
      setSelectedOrders(allOrderIds);
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const isAllSelected =
    items.length > 0 && selectedOrders.size === items.length;
  const isSomeSelected =
    selectedOrders.size > 0 && selectedOrders.size < items.length;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                  <span>Property</span>
                  <span>›</span>
                  <span className="text-foreground font-medium">
                    Order List
                  </span>
                </nav>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-foreground">
                    Order List
                  </h1>
                  {selectedOrders.size > 0 && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {selectedOrders.size} selected
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground w-64"
                  />
                </div>
                <button className="px-4 py-2 border border-border rounded-lg flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div
              className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
                selectedOrders.size > 0 ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">
                    Total Customers
                    {selectedOrders.size > 0 && (
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
                    selectedOrders.size > 0 ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <Users
                    className={`w-6 h-6 ${
                      selectedOrders.size > 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
                selectedOrders.size > 0 ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">
                    Total Transactions
                    {selectedOrders.size > 0 && (
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
                    selectedOrders.size > 0 ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <ShoppingBag
                    className={`w-6 h-6 ${
                      selectedOrders.size > 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
                selectedOrders.size > 0 ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">
                    Revenue
                    {selectedOrders.size > 0 && (
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
                    selectedOrders.size > 0 ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <DollarSign
                    className={`w-6 h-6 ${
                      selectedOrders.size > 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-card border border-border p-4 rounded-xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status Filter
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
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
                            dateRange.from.getTime() ===
                            dateRange.to.getTime() ? (
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
                            setDateRange({ from: undefined, to: undefined });
                            setPage(1);
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
                        onSelect={(
                          range: { from?: Date; to?: Date } | undefined
                        ) => {
                          setDateRange({
                            from: range?.from,
                            to: range?.to,
                          });
                          setPage(1);
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
                              setDateRange({ from: undefined, to: undefined });
                              setPage(1);
                            }}
                            className="flex-1 rounded-lg"
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const today = new Date();
                              setDateRange({ from: today, to: today });
                              setPage(1);
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

              {profile?.role === "SUPER_ADMIN" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Store
                  </label>
                  <select
                    value={storeIdFilter ?? ""}
                    onChange={(e) =>
                      setStoreIdFilter(
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
                  onClick={() => {
                    setSearchQuery("");
                    setStatus("");
                    setDateRange({ from: undefined, to: undefined });
                    setPage(1);
                  }}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium transition-opacity"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Debug panel (dev-only) */}
          {process.env.NODE_ENV !== "production" && (
            <div className="mb-4 p-3 bg-accent/10 border border-accent rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Dev user:</strong> {devUserId ?? "(none)"}
                  <span className="ml-3 text-muted-foreground">
                    (used for x-dev-user-id header)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 bg-gray-200 rounded text-sm"
                    onClick={() => {
                      try {
                        const v =
                          typeof window !== "undefined"
                            ? localStorage.getItem("devUserId")
                            : null;
                        setDevUserId(v);
                      } catch {
                        setDevUserId(null);
                      }
                    }}
                  >
                    Reload
                  </button>
                  <button
                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                    onClick={() => {
                      try {
                        if (typeof window !== "undefined")
                          localStorage.removeItem("devUserId");
                      } catch {}
                      setDevUserId(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              {isLikelyNonAdmin && (
                <div className="mt-2 text-sm text-yellow-700">
                  Dev user looks like a non-admin ({devUserId ?? "(none)"}).
                  Select <strong>2</strong> or <strong>3</strong> in the Dev
                  user switch (sidebar).
                </div>
              )}
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading orders...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-destructive">{error}</p>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  No orders found.
                </p>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            className="rounded border-border cursor-pointer accent-primary"
                            checked={isAllSelected}
                            ref={(input) => {
                              if (input) {
                                input.indeterminate = isSomeSelected;
                              }
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Payment
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {(items as unknown as Order[]).map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-accent/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-border cursor-pointer accent-primary"
                            checked={selectedOrders.has(order.id)}
                            onChange={(e) =>
                              handleSelectOrder(order.id, e.target.checked)
                            }
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/orderManagement/${order.id}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            #{order.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-foreground">
                            Rp{order.grandTotal.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.totalItems} item
                            {order.totalItems !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-foreground uppercase">
                              {order.paymentMethod || "GATEWAY"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {order.payment?.status || "PAID"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                              order.status
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
                            {order.status === "CONFIRMED"
                              ? "Confirmed"
                              : order.status === "CANCELLED"
                              ? "Canceled"
                              : order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            {canConfirmPayment(order) && (
                              <button
                                onClick={() =>
                                  handleOrderAction(order.id, "confirm")
                                }
                                disabled={actionLoading[`${order.id}-confirm`]}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 transition-colors"
                                title="Confirm Payment"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                            {canShip(order) && (
                              <button
                                onClick={() =>
                                  handleOrderAction(order.id, "ship")
                                }
                                disabled={actionLoading[`${order.id}-ship`]}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
                                title="Ship Order"
                              >
                                <Truck className="w-5 h-5" />
                              </button>
                            )}
                            {canCancel(order) && (
                              <button
                                onClick={() =>
                                  handleOrderAction(order.id, "cancel")
                                }
                                disabled={actionLoading[`${order.id}-cancel`]}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50 transition-colors"
                                title="Cancel Order"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            )}
                            <Link
                              href={`/admin/orderManagement/${order.id}`}
                              className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                            <button className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && items.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, meta?.total ?? 0)} of{" "}
                {meta?.total ?? 0} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from(
                    {
                      length: Math.min(
                        5,
                        Math.ceil((meta?.total ?? 0) / pageSize)
                      ),
                    },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={page * pageSize >= (meta?.total ?? 0)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={executeOrderAction}
        onCancel={() =>
          setConfirmDialog({
            open: false,
            orderId: null,
            action: null,
            title: "",
            description: "",
            variant: "default",
          })
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant={confirmDialog.variant}
      />
    </div>
  );
}
