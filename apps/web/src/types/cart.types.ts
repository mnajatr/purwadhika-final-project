export interface CartItem {
  id: number;
  productId: number;
  qty: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    isActive: boolean;
  };
  storeInventory?: {
    stockQty: number;
  };
}

export interface Cart {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface CartTotals {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface AddToCartRequest {
  productId: number;
  qty: number;
  storeId: number;
  userId: number;
}

export interface UpdateCartItemRequest {
  qty: number;
  userId: number;
  storeId: number;
}

export interface CartItemParams {
  itemId: string;
}

export interface CartQueryParams {
  userId?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartStoreState {
  cart: Cart | null;
  totals: CartTotals | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  storeId: number;
  itemCount: number;
  totalAmount: number;
  isEmpty: boolean;

  setStoreId: (storeId: number) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  updateComputedValues: () => void;
  initializeCart: (userId: number) => Promise<void>;
  addToCart: (productId: number, qty: number, userId: number) => Promise<void>;
  updateCartItem: (
    itemId: number,
    qty: number,
    userId: number
  ) => Promise<void>;
  removeCartItem: (itemId: number, userId: number) => Promise<void>;
  clearCart: (userId: number) => Promise<void>;
  refreshCart: (userId: number) => Promise<void>;
  refreshTotals: (userId: number) => Promise<void>;
}
