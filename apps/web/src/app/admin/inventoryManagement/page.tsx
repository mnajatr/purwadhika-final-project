"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { inventoryApi } from "@/services/inventory.service";
import { ApiError } from "@/lib/axios-client";
import { StockTransferForm } from "@/components/admin/inventory/StockTransferForm";
import { toast } from "sonner";

export default function InventoryManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "transfer" | "adjustment" | "journal"
  >("transfer");

  // Remove transfer states - now handled by StockTransferForm component
  // Manual adjustment states
  const [adjustmentStoreId, setAdjustmentStoreId] = useState<string>("");
  const [adjustmentProductId, setAdjustmentProductId] = useState<string>("");
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("ADD");

  // Stock journal states
  const [selectedStoreForJournal, setSelectedStoreForJournal] =
    useState<string>("");
  const [journalDateFrom, setJournalDateFrom] = useState<string>("");
  const [journalDateTo, setJournalDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // React Query hooks
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: inventoryApi.getStores,
  });

  const { data: adjustmentProducts = [] } = useQuery({
    queryKey: ["storeInventory", adjustmentStoreId],
    queryFn: () => inventoryApi.getStoreInventory(parseInt(adjustmentStoreId)),
    enabled: !!adjustmentStoreId,
  });

  const { data, isLoading: journalsLoading } = useQuery({
    queryKey: [
      "stockJournals",
      selectedStoreForJournal,
      journalDateFrom,
      journalDateTo,
      page,
    ],
    queryFn: () =>
      inventoryApi.getStockJournals({
        storeId: selectedStoreForJournal,
        startDate: journalDateFrom,
        endDate: journalDateTo,
        limit: pageSize,
        page: page,
      }),
    enabled: activeTab === "journal",
  });
  const stockJournals = data?.journals ?? [];
  const totalData = data?.total ?? 0;

  // Mutations
  const adjustmentMutation = useMutation({
    mutationFn: inventoryApi.adjustStock,
    onSuccess: () => {
      toast.success("✅ Stock adjustment successful!", {
        description: "Inventory has been updated",
      });
      setAdjustmentStoreId("");
      setAdjustmentProductId("");
      setAdjustmentQty(1);
      setAdjustmentReason("ADD");
      queryClient.invalidateQueries({ queryKey: ["storeInventory"] });
      queryClient.invalidateQueries({ queryKey: ["stockJournals"] });
    },
    onError: (error: ApiError) => {
      toast.error("❌ Failed to adjust stock", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Handler functions
  const handleManualAdjustment = () => {
    if (
      !adjustmentStoreId ||
      !adjustmentProductId ||
      !adjustmentQty ||
      !adjustmentReason
    ) {
      toast.error("Please fill all fields");
      return;
    }

    if (adjustmentQty === 0) {
      toast.error("Quantity cannot be zero");
      return;
    }

    adjustmentMutation.mutate({
      storeId: parseInt(adjustmentStoreId),
      productId: parseInt(adjustmentProductId),
      qtyChange: adjustmentQty,
      reason: adjustmentReason,
    });
  };

  const formatDate = (dateString: string) => {
    return (
      new Date(dateString).toLocaleDateString() +
      " " +
      new Date(dateString).toLocaleTimeString()
    );
  };

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case "ADD":
        return "bg-green-100 text-green-800";
      case "REMOVE":
        return "bg-red-100 text-red-800";
      case "TRANSFER_IN":
        return "bg-blue-100 text-blue-800";
      case "TRANSFER_OUT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        Inventory Management
      </h1>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Button
              variant={activeTab === "transfer" ? "default" : "ghost"}
              onClick={() => setActiveTab("transfer")}
              className="py-2 px-1 border-b-2 font-medium text-sm"
            >
              Stock Transfer
            </Button>
            <Button
              variant={activeTab === "journal" ? "default" : "ghost"}
              onClick={() => setActiveTab("journal")}
              className="py-2 px-1 border-b-2 font-medium text-sm"
            >
              Stock Journal
            </Button>
            <Button
              variant={activeTab === "adjustment" ? "default" : "ghost"}
              onClick={() => setActiveTab("adjustment")}
              className="py-2 px-1 border-b-2 font-medium text-sm"
            >
              Manual Adjustment
            </Button>
          </nav>
        </div>
      </div>

      {/* Transfer Tab */}
      {activeTab === "transfer" && <StockTransferForm />}

      {/* Manual Adjustment Tab */}
      {activeTab === "adjustment" && (
        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            Manual Stock Adjustment
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Store Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store
              </label>
              <select
                value={adjustmentStoreId}
                onChange={(e) => setAdjustmentStoreId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card"
              >
                <option value="">Select store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id.toString()}>
                    {store.name} - {store.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={adjustmentProductId}
                onChange={(e) => setAdjustmentProductId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card"
                disabled={!adjustmentStoreId}
              >
                <option value="">Select product</option>
                {adjustmentProducts.map((product) => (
                  <option key={product.id} value={product.id.toString()}>
                    {product.name} (Current Stock: {product.stockQty})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Change
              </label>
              <input
                type="number"
                value={adjustmentQty}
                onChange={(e) =>
                  setAdjustmentQty(parseInt(e.target.value) || 0)
                }
                placeholder="Enter quantity (positive to add, negative to reduce)"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use positive numbers to increase stock, negative to decrease
              </p>
            </div>

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) =>
                  setAdjustmentReason(e.target.value as "ADD" | "REMOVE")
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card"
              >
                <option value="ADD">Stock Addition</option>
                <option value="REMOVE">Stock Removal</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleManualAdjustment}
              disabled={
                !adjustmentStoreId ||
                !adjustmentProductId ||
                adjustmentQty === 0
              }
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Apply Adjustment
            </button>
          </div>
        </div>
      )}

      {/* Journal Tab */}
      {activeTab === "journal" && (
        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            Stock Journal
          </h2>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store
              </label>
              <select
                value={selectedStoreForJournal}
                onChange={(e) => setSelectedStoreForJournal(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card"
              >
                <option value="">All stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id.toString()}>
                    {store.name} - {store.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={journalDateFrom}
                onChange={(e) => setJournalDateFrom(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={journalDateTo}
                onChange={(e) => setJournalDateTo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Stock Journal Table */}
          {journalsLoading ? (
            <div className="text-center py-8 text-gray-600">
              Loading stock journals...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full bg-card">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-gray-200">
                  {stockJournals.map((journal) => (
                    <tr key={journal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(journal.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {journal.store.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {journal.product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`font-medium ${
                            journal.qtyChange > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {journal.qtyChange > 0 ? "+" : ""}
                          {journal.qtyChange}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReasonBadgeColor(
                            journal.reason
                          )}`}
                        >
                          {journal.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {journal.admin.email}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        title={journal.note || ""}
                      >
                        {journal.note
                          ? journal.note.length > 80
                            ? journal.note.slice(0, 80) + "…"
                            : journal.note
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    className="px-3 py-2 bg-card border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-2 bg-card border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page * pageSize >= totalData}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
                <div className="text-sm text-gray-700">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, totalData)} of {totalData} results
                </div>
              </div>

              {stockJournals.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No stock journal entries found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
