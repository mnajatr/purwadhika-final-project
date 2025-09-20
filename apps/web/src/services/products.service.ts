import apiClient from "@/lib/axios-client";
import { ProductResponse } from "@/types/products.type";

interface NearestStoreResponse {
  products: ProductResponse[];
  nearestStore: {
    id: number;
    name: string;
    locations: Array<{
      id: number;
      latitude: number;
      longitude: number;
      storeId: number;
    }>;
  } | null;
  message: string;
}

class ProductsService {
  private readonly basePath = "/products";

  async getProducts(lat?: number, lon?: number) {
    let url = this.basePath;
    const params = new URLSearchParams();

    if (lat !== undefined && lon !== undefined) {
      params.append("lat", lat.toString());
      params.append("lon", lon.toString());
      url += `?${params.toString()}`;
    }

    // Always expect the new response format since API now always returns it
    const response = await apiClient.get<NearestStoreResponse>(url);

    return {
      products: response.products.map((product) => {
        const inventory = product.inventories?.[0];
        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          isActive: Object.prototype.hasOwnProperty.call(product, "isActive") ? (product as unknown as { isActive?: boolean }).isActive : true,
          category: product.category.name,
          store: inventory?.store?.name || "Unknown",
          imageUrl: product.images?.[0]?.imageUrl || "/placeholder.png",
        };
      }),
      nearestStore: response.nearestStore,
      message: response.message,
    };
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

  async deactivateProduct(slug: string) {
    const resp = await apiClient.patch<{ message: string; product?: ProductResponse }>(
      `${this.basePath}/${slug}/deactivate`
    );
    return resp;
  }

  async activateProduct(slug: string) {
    const resp = await apiClient.patch<{ message: string; product?: ProductResponse }>(
      `${this.basePath}/${slug}/activate`
    );
    return resp;
  }
}

export const productsService = new ProductsService();
export const getProducts = (lat?: number, lon?: number) =>
  productsService.getProducts(lat, lon);
export const getProductBySlug = (slug: string) =>
  productsService.getProductBySlug(slug);
export const createProduct = (data: ProductResponse) =>
  productsService.createProduct(data);
export const updateProduct = (slug: string, data: Partial<ProductResponse>) =>
  productsService.updateProduct(slug, data);
export const deleteProduct = (slug: string) =>
  productsService.deleteProduct(slug);
