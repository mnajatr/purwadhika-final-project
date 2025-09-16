import { apiClient } from '@/lib/axios-client';

export interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  province: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stockQty: number;
  category: {
    name: string;
  };
}

interface InventoryItem {
  stockQty: number;
  product: {
    id: number;
    name: string;
    price: number;
    category: {
      name: string;
    };
  };
}

export interface StockJournal {
  id: number;
  productId: number;
  qtyChange: number;
  reason: string;
  createdAt: string;
  product: {
    name: string;
  };
  store: {
    name: string;
  };
  admin: {
    email: string;
  };
  note?: string;
}

export interface TransferRequest {
  fromStoreId: number;
  toStoreId: number;
  items: Array<{
    productId: number;
    qty: number;
  }>;
  note?: string;
}

export const inventoryApi = {
  // Get all stores
  getStores: async (): Promise<Store[]> => {
    const response = await apiClient.get<{ data: Store[] }>('/stores');
    return response.data;
  },

  // Get store inventory
  getStoreInventory: async (storeId: number, limit = 1000): Promise<Product[]> => {
    const response = await apiClient.get<{ data: { inventories: InventoryItem[] } }>(`/admin/inventory/stores/${storeId}?limit=${limit}`);
    return response.data.inventories.map((inv: InventoryItem) => ({
      id: inv.product.id,
      name: inv.product.name,
      price: inv.product.price,
      stockQty: inv.stockQty,
      category: inv.product.category,
    }));
  },

  // Get stock journals
  getStockJournals: async (params: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<StockJournal[]> => {
    const searchParams = new URLSearchParams();
    if (params.storeId) searchParams.append('storeId', params.storeId);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    searchParams.append('limit', (params.limit || 50).toString());

    const response = await apiClient.get<{ data: { journals: StockJournal[] } }>(`/admin/inventory/stock-journals?${searchParams.toString()}`);
    return response.data.journals;
  },

  // Transfer inventory
  transferInventory: async (data: TransferRequest): Promise<void> => {
    await apiClient.post('/admin/inventory/transfer', data);
  },

  // Manual stock adjustment
  adjustStock: async (data: {
    storeId: number;
    productId: number;
    changeQty: number;
    reason: string;
  }): Promise<void> => {
    await apiClient.post('/admin/inventory/update-stock', data);
  },
};
