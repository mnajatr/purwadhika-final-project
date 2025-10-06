"use client";

import { ArrowRight, Trash2 } from "lucide-react";

export interface TransferItem {
  productId: number;
  productName: string;
  qty: number;
  availableStock: number;
}

interface TransferItemsTableProps {
  items: TransferItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQty: (index: number, newQty: number) => void;
}

export function TransferItemsTable({
  items,
  onRemoveItem,
  onUpdateQty,
}: TransferItemsTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-border pt-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <ArrowRight className="h-5 w-5 text-primary" />
        Items to Transfer ({items.length})
      </h3>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Available Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transfer Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {items.map((item, index) => (
              <tr
                key={item.productId}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {item.productName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {item.availableStock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  <input
                    type="number"
                    min="1"
                    max={item.availableStock}
                    value={item.qty}
                    onChange={(e) => {
                      const newQty = parseInt(e.target.value) || 1;
                      onUpdateQty(index, newQty);
                    }}
                    className="w-24 p-2 border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-primary transition-colors bg-background"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="text-destructive hover:opacity-80 transition-opacity flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-muted border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground">
            <span className="font-medium">Total items:</span> {items.length}{" "}
            product(s)
          </div>
          <div className="text-sm text-foreground">
            <span className="font-medium">Total quantity:</span>{" "}
            {items.reduce((sum, item) => sum + item.qty, 0)} unit(s)
          </div>
        </div>
      </div>
    </div>
  );
}
