export type ProductResponse = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  category: { name: string };
  weight: number;
  volume: number;
  inventories?: {
    store?: { name: string };
  }[];
  images?: { imageUrl: string }[];
};
