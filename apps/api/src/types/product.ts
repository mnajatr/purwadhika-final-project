export type CreateProduct = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  categoryId: number;
  weight: number;
  width?: number;
  height?: number;
  length?: number;
  images?: { imageUrl: string }[];
  inventories?: {
    stockQty: number;
    storeId: number;
  }[];
};
