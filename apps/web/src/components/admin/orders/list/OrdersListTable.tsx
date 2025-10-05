import { ShoppingBag } from "lucide-react";
import OrdersListPagination from "./OrdersListPagination";
import OrdersListRow from "./OrdersListRow";
import type { AdminOrderListItem } from "@repo/schemas";

interface OrdersListTableProps {
  items: AdminOrderListItem[];
  loading: boolean;
  error: string | null;
  selectedOrders: Set<number>;
  onSelectAll: (checked: boolean) => void;
  onSelectOrder: (orderId: number, checked: boolean) => void;
  onOrderAction: (
    orderId: number,
    action: "confirm" | "ship" | "cancel"
  ) => void;
  actionLoading: Record<string, boolean>;
  page: number;
  pageSize: number;
  meta: { total: number; page: number } | null;
  onPageChange: (page: number) => void;
}

export default function OrdersListTable({
  items,
  loading,
  error,
  selectedOrders,
  onSelectAll,
  onSelectOrder,
  onOrderAction,
  actionLoading,
  page,
  pageSize,
  meta,
  onPageChange,
}: OrdersListTableProps) {
  const isAllSelected =
    items.length > 0 && selectedOrders.size === items.length;
  const isSomeSelected =
    selectedOrders.size > 0 && selectedOrders.size < items.length;

  return (
    <>
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
            <p className="text-muted-foreground text-lg">No orders found.</p>
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
                        onChange={(e) => onSelectAll(e.target.checked)}
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
                {items.map((order) => (
                  <OrdersListRow
                    key={order.id}
                    order={order}
                    isSelected={selectedOrders.has(order.id)}
                    onSelect={onSelectOrder}
                    onOrderAction={onOrderAction}
                    actionLoading={actionLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && items.length > 0 && (
        <OrdersListPagination
          page={page}
          pageSize={pageSize}
          total={meta?.total ?? 0}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
