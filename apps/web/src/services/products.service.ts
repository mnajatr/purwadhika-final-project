import apiClient from "@/lib/axios-client";
import { ProductResponse } from "@/types/products.type";

class ProductsService {
  private readonly basePath = "/products";

  async getProducts() {
    // langsung array of ProductResponse
    const products = await apiClient.get<ProductResponse[]>(this.basePath);

    return products.map((product) => {
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
  }
  async getProductBySlug(slug: string) {
    const product = await apiClient.get<ProductResponse>(
      `${this.basePath}/${slug}`
    );
    const inventory = product.inventories?.[0];

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      category: product.category?.name,
      store: inventory?.store?.name || "Unknown",
      weight: product.weight,
      volume: product.volume,
      imageUrl: product.images?.[0]?.imageUrl || "/placeholder.png",
    };
  }
}

export const productsService = new ProductsService();
export const getProducts = () => productsService.getProducts();
export const getProductBySlug = (slug: string) =>
  productsService.getProductBySlug(slug);
