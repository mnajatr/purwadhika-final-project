"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inventoryApi } from "@/services/inventory.service";
import { ApiError } from "@/lib/axios-client";
import { Plus, Package, ArrowRight } from "lucide-react";
import { TransferFormFields } from "./TransferFormFields";
import { TransferItemsTable, type TransferItem } from "./TransferItemsTable";

// Validation schema
const transferSchema = z.object({
  fromStoreId: z.string().min(1, "Source store is required"),
  toStoreId: z.string().min(1, "Destination store is required"),
  note: z
    .string()
    .min(1, "Transfer note/reason is required")
    .min(3, "Note must be at least 3 characters"),
});

type TransferFormData = z.infer<typeof transferSchema>;

export function StockTransferForm() {
  const queryClient = useQueryClient();
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [transferQty, setTransferQty] = useState<number>(1);
  const [productError, setProductError] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromStoreId: "",
      toStoreId: "",
      note: "",
    },
  });

  const fromStoreId = watch("fromStoreId");

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: inventoryApi.getStores,
  });

  // Fetch products from source store
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["storeInventory", fromStoreId],
    queryFn: () => inventoryApi.getStoreInventory(parseInt(fromStoreId)),
    enabled: !!fromStoreId,
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: inventoryApi.transferInventory,
    onSuccess: () => {
      toast.success("✅ Inventory transferred successfully!", {
        description: "Stock has been moved between stores",
      });
      setTransferItems([]);
      reset();
      setSelectedProductId("");
      setTransferQty(1);
      queryClient.invalidateQueries({ queryKey: ["storeInventory"] });
      queryClient.invalidateQueries({ queryKey: ["stockJournals"] });
    },
    onError: (error: ApiError) => {
      toast.error("❌ Failed to transfer inventory", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Add item to transfer list
  const addTransferItem = () => {
    setProductError("");

    if (!selectedProductId) {
      setProductError("Please select a product");
      return;
    }

    if (transferQty <= 0) {
      setProductError("Quantity must be greater than 0");
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) {
      setProductError("Product not found");
      return;
    }

    if (transferQty > product.stockQty) {
      setProductError(`Insufficient stock. Available: ${product.stockQty}`);
      return;
    }

    const existingIndex = transferItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingIndex >= 0) {
      const updatedItems = [...transferItems];
      const newQty = updatedItems[existingIndex].qty + transferQty;

      if (newQty > product.stockQty) {
        setProductError(
          `Total quantity exceeds available stock. Available: ${product.stockQty}`
        );
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
    toast.success("Item added to transfer list");
  };

  // Remove item from transfer list
  const removeTransferItem = (index: number) => {
    const item = transferItems[index];
    setTransferItems(transferItems.filter((_, i) => i !== index));
    toast.info(`${item.productName} removed from list`);
  };

  // Update item quantity
  const updateItemQty = (index: number, newQty: number) => {
    const updatedItems = [...transferItems];
    const item = updatedItems[index];

    if (newQty > item.availableStock) {
      toast.error(`Cannot exceed available stock (${item.availableStock})`);
      return;
    }

    if (newQty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    updatedItems[index].qty = newQty;
    setTransferItems(updatedItems);
  };

  // Handle from store change
  const handleFromStoreChange = (value: string) => {
    setValue("fromStoreId", value);
    setTransferItems([]); // Clear items when store changes
  };

  // Submit form
  const onSubmit = (data: TransferFormData) => {
    if (data.fromStoreId === data.toStoreId) {
      toast.error("Source and destination stores must be different");
      return;
    }

    if (transferItems.length === 0) {
      toast.error("Please add at least one item to transfer");
      return;
    }

    transferMutation.mutate({
      fromStoreId: parseInt(data.fromStoreId),
      toStoreId: parseInt(data.toStoreId),
      items: transferItems.map((item) => ({
        productId: item.productId,
        qty: item.qty,
      })),
      note: data.note,
    });
  };

  return (
    <div className="bg-card rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Package className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">
          Stock Transfer
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields */}
        <TransferFormFields
          register={register}
          errors={errors}
          stores={stores}
          fromStoreId={fromStoreId}
          onFromStoreChange={handleFromStoreChange}
        />

        {/* Add Items Section */}
        {fromStoreId && (
          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Items to Transfer
            </h3>

            {productsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Loading inventory...
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setProductError("");
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary transition-colors bg-background ${
                      productError ? "border-destructive" : "border-border"
                    }`}
                  >
                    <option value="">Select product</option>
                    {products
                      .filter((product) => product.stockQty > 0)
                      .map((product) => (
                        <option key={product.id} value={product.id.toString()}>
                          {product.name} (Stock: {product.stockQty})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="w-32 space-y-2">
                  <input
                    type="number"
                    min="1"
                    value={transferQty}
                    onChange={(e) => {
                      setTransferQty(parseInt(e.target.value) || 1);
                      setProductError("");
                    }}
                    placeholder="Qty"
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary transition-colors bg-background"
                  />
                </div>

                <Button
                  type="button"
                  onClick={addTransferItem}
                  className="px-6 py-3 bg-primary-gradient text-primary-foreground rounded-lg hover:opacity-95 transition-all whitespace-nowrap flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            )}

            {productError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span>⚠</span>
                {productError}
              </p>
            )}
          </div>
        )}

        {/* Transfer Items Table */}
        <TransferItemsTable
          items={transferItems}
          onRemoveItem={removeTransferItem}
          onUpdateQty={updateItemQty}
        />

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={transferMutation.isPending || transferItems.length === 0}
            className={`px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
              transferMutation.isPending || transferItems.length === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary-gradient text-primary-foreground hover:opacity-95 shadow-lg"
            }`}
          >
            {transferMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Transferring...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Transfer Inventory
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
