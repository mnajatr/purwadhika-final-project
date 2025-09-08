import apiClient from "@/lib/axios-client";

export type ProductResponse = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  category: { name: string };
  inventories?: {
    store?: { name: string };
  }[];
  images?: { imageUrl: string }[];
};

export const getProducts = async () => {
  const data = await apiClient.get<ProductResponse[]>("/products");

  return data.map((product) => {
    const inventory = product.inventories?.[0];
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      category: product.category.name,
      store: inventory?.store?.name || "Unknown",
      imageUrl: product.images?.[0]?.imageUrl || "/placeholder.png",
    };
  });
};
