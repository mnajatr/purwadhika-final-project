"use client";

import Sidebar from "@/components/admin/sidebar";
import { useState, useEffect, useMemo } from "react";
import { useOrders } from "@/hooks/useOrders";
import { adminOrdersService as ordersService } from "@/services/adminOrders.service";
import { storesService } from "@/services/stores.service";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import OrdersListHeader from "@/components/admin/orders/list/OrdersListHeader";
import OrdersListStats from "@/components/admin/orders/list/OrdersListStats";
import OrdersListFilters from "@/components/admin/orders/list/OrdersListFilters";
import OrdersListTable from "@/components/admin/orders/list/OrdersListTable";
import { toast } from "sonner";

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
  const { items, loading, error, reload, meta } = useOrders({
    page,
    pageSize,
    status: status || undefined,
    q: searchQuery || undefined,
    storeId: storeIdFilter,
    from: dateRange.from,
    to: dateRange.to,
  });

  const [stores, setStores] = useState<Array<{ id: number; name: string }>>([]);
  const [profile, setProfile] = useState<{
    id: number;
    role: string;
    storeId?: number | null;
  } | null>(null);
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

  useEffect(() => {
    setSelectedOrders(new Set());
  }, [status, searchQuery, storeIdFilter, dateRange.from, dateRange.to, page]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const allData = await ordersService.getOrders({
          page: 1,
          pageSize: 10000,
          status: status || undefined,
          q: searchQuery || undefined,
          storeId: storeIdFilter,
          from: dateRange.from,
          to: dateRange.to,
        });

        if (mounted && allData.items) {
          const uniqueCustomers = new Set(
            allData.items.map((item) => item.userId)
          ).size;
          const totalRev = allData.items.reduce(
            (sum, item) => sum + item.grandTotal,
            0
          );

          setAllOrdersStats({
            totalCustomers: uniqueCustomers,
            totalTransactions: allData.items.length,
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

  const stats = useMemo<OrderStats>(() => {
    if (selectedOrders.size > 0 && items && items.length > 0) {
      const ordersToCalculate = items.filter((order) =>
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

    return allOrdersStats;
  }, [items, selectedOrders, allOrdersStats]);

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
          if (
            profileResp &&
            profileResp.role === "STORE_ADMIN" &&
            profileResp.storeId
          ) {
            setStoreIdFilter(profileResp.storeId);
          }
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleOrderAction = async (
    orderId: number,
    action: "confirm" | "ship" | "cancel"
  ) => {
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
      toast.success(`Order #${orderId} ${actionNames[action]}ed successfully!`);
      reload();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast.error(`Failed to ${actionNames[action]} order: ${message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allOrderIds = new Set(items.map((order) => order.id));
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

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <OrdersListHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCount={selectedOrders.size}
          />

          <OrdersListStats stats={stats} selectedCount={selectedOrders.size} />

          <OrdersListFilters
            status={status}
            onStatusChange={setStatus}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            storeIdFilter={storeIdFilter}
            onStoreIdChange={setStoreIdFilter}
            stores={stores}
            userRole={profile?.role}
            onClearFilters={() => {
              setSearchQuery("");
              setStatus("");
              setDateRange({ from: undefined, to: undefined });
              setPage(1);
            }}
            onRefresh={reload}
            onPageReset={() => setPage(1)}
          />

          <OrdersListTable
            items={items}
            loading={loading}
            error={error}
            selectedOrders={selectedOrders}
            onSelectAll={handleSelectAll}
            onSelectOrder={handleSelectOrder}
            onOrderAction={handleOrderAction}
            actionLoading={actionLoading}
            page={page}
            pageSize={pageSize}
            meta={meta}
            onPageChange={setPage}
          />
        </div>
      </div>

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
