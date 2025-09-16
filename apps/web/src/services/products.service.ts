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
      width: product.width,
      height: product.height,
      length: product.length,
      imageUrl: product.images?.[0]?.imageUrl || "/placeholder.png",
    };
  }

  async createProduct(data: ProductResponse) {
    const product = await apiClient.post<ProductResponse>(this.basePath, data);

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      category: product.category?.name,
      store: product.inventories?.[0]?.store?.name || "Unknown",
      weight: product.weight,
      width: product.width,
      height: product.height,
      length: product.length,
      imageUrl: product.images?.[0]?.imageUrl || "/placeholder.png",
    };
  }

  async updateProduct(slug: string, data: Partial<ProductResponse>) {
    const product = await apiClient.put<ProductResponse>(
      `${this.basePath}/${slug}`,
      data
    );

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      category: product.category?.name,
      store: product.inventories?.[0]?.store?.name || "Unknown",
      weight: product.weight,
      width: product.width,
      height: product.height,
      length: product.length,
      imageUrl: product.images?.[0]?.imageUrl || "/placeholder.png",
    };
  }
  async deleteProduct(slug: string) {
    await apiClient.delete(`${this.basePath}/${slug}`);
    return { message: "Product deleted successfully" };
  }
}

export const productsService = new ProductsService();
export const getProducts = () => productsService.getProducts();
export const getProductBySlug = (slug: string) =>
  productsService.getProductBySlug(slug);
export const createProduct = (data: ProductResponse) =>
  productsService.createProduct(data);
export const updateProduct = (slug: string, data: Partial<ProductResponse>) =>
  productsService.updateProduct(slug, data);
export const deleteProduct = (slug: string) =>
  productsService.deleteProduct(slug);
