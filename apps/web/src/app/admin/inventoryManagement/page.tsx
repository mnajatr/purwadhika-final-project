"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inventoryApi, type Store, type Product, type StockJournal } from "@/services/inventory.service";
import { ApiError } from "@/lib/axios-client";

interface TransferItem {
  productId: number;
  productName: string;
  qty: number;
  availableStock: number;
}

export default function InventoryManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"transfer" | "adjustment" | "journal">("transfer");
  
  // Transfer states
  const [fromStoreId, setFromStoreId] = useState<string>("");
  const [toStoreId, setToStoreId] = useState<string>("");
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferNote, setTransferNote] = useState<string>("");
  
  // Manual adjustment states
  const [adjustmentStoreId, setAdjustmentStoreId] = useState<string>("");
  const [adjustmentProductId, setAdjustmentProductId] = useState<string>("");
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("ADD");
  
  // Stock journal states
  const [selectedStoreForJournal, setSelectedStoreForJournal] = useState<string>("");
  const [journalDateFrom, setJournalDateFrom] = useState<string>("");
  const [journalDateTo, setJournalDateTo] = useState<string>("");

  // React Query hooks
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: inventoryApi.getStores,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['storeInventory', fromStoreId],
    queryFn: () => inventoryApi.getStoreInventory(parseInt(fromStoreId)),
    enabled: !!fromStoreId,
  });

  const { data: adjustmentProducts = [] } = useQuery({
    queryKey: ['storeInventory', adjustmentStoreId],
    queryFn: () => inventoryApi.getStoreInventory(parseInt(adjustmentStoreId)),
    enabled: !!adjustmentStoreId,
  });

  const { data: stockJournals = [], isLoading: journalsLoading, refetch: refetchJournals } = useQuery({
    queryKey: ['stockJournals', selectedStoreForJournal, journalDateFrom, journalDateTo],
    queryFn: () => inventoryApi.getStockJournals({
      storeId: selectedStoreForJournal,
      startDate: journalDateFrom,
      endDate: journalDateTo,
    }),
    enabled: activeTab === 'journal',
  });

  // Mutations
  const transferMutation = useMutation({
    mutationFn: inventoryApi.transferInventory,
    onSuccess: () => {
      alert("Inventory transferred successfully");
      setTransferItems([]);
      setFromStoreId("");
      setToStoreId("");
      setTransferNote("");
      queryClient.invalidateQueries({ queryKey: ['storeInventory'] });
      queryClient.invalidateQueries({ queryKey: ['stockJournals'] });
    },
    onError: (error: ApiError) => {
      alert(error.response?.data?.message || "Failed to transfer inventory");
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: inventoryApi.adjustStock,
    onSuccess: () => {
      alert("Stock adjustment successful!");
      setAdjustmentStoreId("");
      setAdjustmentProductId("");
      setAdjustmentQty(1);
      setAdjustmentReason("ADD");
      queryClient.invalidateQueries({ queryKey: ['storeInventory'] });
      queryClient.invalidateQueries({ queryKey: ['stockJournals'] });
    },
    onError: (error: ApiError) => {
      alert(error.response?.data?.message || "Failed to adjust stock");
    },
  });

  // Handler functions
  const handleManualAdjustment = () => {
    if (!adjustmentStoreId || !adjustmentProductId || !adjustmentQty || !adjustmentReason) {
      alert("Please fill all fields");
      return;
    }

    if (adjustmentQty === 0) {
      alert("Quantity cannot be zero");
      return;
    }

    adjustmentMutation.mutate({
      storeId: parseInt(adjustmentStoreId),
      productId: parseInt(adjustmentProductId),
      changeQty: adjustmentQty,
      reason: adjustmentReason,
    });
  };
  const addTransferItem = () => {
    if (!selectedProductId || transferQty <= 0) {
      alert("Please select a product and enter a valid quantity");
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedProductId));
    if (!product) {
      alert("Product not found");
      return;
    }

    if (transferQty > product.stockQty) {
      alert(`Insufficient stock. Available: ${product.stockQty}`);
      return;
    }

    const existingIndex = transferItems.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      const updatedItems = [...transferItems];
      const newQty = updatedItems[existingIndex].qty + transferQty;
      
      if (newQty > product.stockQty) {
        alert(`Total quantity exceeds available stock. Available: ${product.stockQty}`);
        return;
      }
      
      updatedItems[existingIndex].qty = newQty;
      setTransferItems(updatedItems);
    } else {
      const newItem: TransferItem = {
        productId: product.id,
        productName: product.name,
        qty: transferQty,
        availableStock: product.stockQty,
      };
      setTransferItems([...transferItems, newItem]);
    }

    setSelectedProductId("");
    setTransferQty(1);
  };

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleTransfer = () => {
    if (!fromStoreId || !toStoreId) {
      alert("Please select both source and destination stores");
      return;
    }

    if (fromStoreId === toStoreId) {
      alert("Source and destination stores must be different");
      return;
    }

    if (transferItems.length === 0) {
      alert("Please add at least one item to transfer");
      return;
    }

    transferMutation.mutate({
      fromStoreId: parseInt(fromStoreId),
      toStoreId: parseInt(toStoreId),
      items: transferItems.map(item => ({
        productId: item.productId,
        qty: item.qty,
      })),
      note: transferNote,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString();
  };

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case "ADD": return "bg-green-100 text-green-800";
      case "REMOVE": return "bg-red-100 text-red-800";
      case "TRANSFER_IN": return "bg-blue-100 text-blue-800";
      case "TRANSFER_OUT": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Inventory Management</h1>

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
          </nav>
        </div>
      </div>

      {/* Transfer Tab */}
      {activeTab === "transfer" && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Inventory Transfer</h2>
          
          {/* Store Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Store
              </label>
              <select 
                value={fromStoreId} 
                onChange={(e) => setFromStoreId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select source store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id.toString()}>
                    {store.name} - {store.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Store
              </label>
              <select 
                value={toStoreId} 
                onChange={(e) => setToStoreId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select destination store</option>
                {stores
                  .filter(store => store.id.toString() !== fromStoreId)
                  .map((store) => (
                    <option key={store.id} value={store.id.toString()}>
                      {store.name} - {store.city}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Add Items Section */}
          {fromStoreId && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Items to Transfer</h3>
              
              {productsLoading ? (
                <div className="text-center py-4 text-gray-600">Loading inventory...</div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <select 
                      value={selectedProductId} 
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select product</option>
                      {products
                        .filter(product => product.stockQty > 0)
                        .map((product) => (
                          <option key={product.id} value={product.id.toString()}>
                            {product.name} (Stock: {product.stockQty})
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div className="w-32">
                    <input
                      type="number"
                      min="1"
                      value={transferQty}
                      onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={addTransferItem}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
                  >
                    Add Item
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Transfer Items Table */}
          {transferItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Items to Transfer</h3>
              
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transfer Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transferItems.map((item, index) => (
                      <tr key={item.productId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.availableStock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="number"
                            min="1"
                            max={item.availableStock}
                            value={item.qty}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              const updatedItems = [...transferItems];
                              updatedItems[index].qty = Math.min(newQty, item.availableStock);
                              setTransferItems(updatedItems);
                            }}
                            className="w-20 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => removeTransferItem(index)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Reason / note (e.g. REPLENISH)"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={handleTransfer}
                    disabled={transferMutation.isPending || transferItems.length === 0}
                    className={`px-8 py-3 rounded-md font-medium transition-colors ${
                      transferMutation.isPending || transferItems.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    }`}
                  >
                    {transferMutation.isPending ? "Transferring..." : "Transfer Inventory"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Adjustment Tab */}
      {activeTab === "adjustment" && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Manual Stock Adjustment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Store Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store
              </label>
              <select 
                value={adjustmentStoreId} 
                onChange={(e) => setAdjustmentStoreId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 0)}
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
                onChange={(e) => setAdjustmentReason(e.target.value as "ADD" | "REMOVE")}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              disabled={!adjustmentStoreId || !adjustmentProductId || adjustmentQty === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Apply Adjustment
            </button>
          </div>
        </div>
      )}

      {/* Journal Tab */}
      {activeTab === "journal" && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Stock Journal</h2>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store
              </label>
              <select 
                value={selectedStoreForJournal} 
                onChange={(e) => setSelectedStoreForJournal(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
            <div className="text-center py-8 text-gray-600">Loading stock journals...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full bg-white">
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
                <tbody className="bg-white divide-y divide-gray-200">
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
                        <span className={`font-medium ${
                          journal.qtyChange > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {journal.qtyChange > 0 ? "+" : ""}{journal.qtyChange}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReasonBadgeColor(journal.reason)}`}>
                          {journal.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {journal.admin.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" title={journal.note || ''}>
                        {journal.note ? (journal.note.length > 80 ? journal.note.slice(0, 80) + '…' : journal.note) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
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
