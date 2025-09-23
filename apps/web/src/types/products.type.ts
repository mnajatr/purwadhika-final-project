export type ProductResponse = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  category: { name: string };
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
