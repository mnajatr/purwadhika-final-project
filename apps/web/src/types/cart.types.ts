// Cart Types
export interface CartItem {
  id: number;
  productId: number;
  qty: number;
  unitPriceSnapshot: string; // Decimal dari backend dikirim sebagai string
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
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

// Request Types
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

// Product Types (for cart integration)
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
