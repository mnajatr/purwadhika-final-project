export type ProductResponse = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  category: { id: number; name: string };
  weight: number;
  width?: number;
  height?: number;
  length?: number;
  inventories?: {
    stockQty: number;
    store?: { name: string };
  }[];
  images?: { imageUrl: string }[];
};

export type ProductCreateRequest = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  categoryId: number;
  weight: number;
  width?: number;
  height?: number;
  length?: number;
  images?: (File | { imageUrl: string })[];
  inventories?: {
    stockQty: number;
    storeId: number;
  }[];
};
