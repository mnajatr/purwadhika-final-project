import apiClient from "@/lib/axios-client";
import { ProductResponse } from "@/types/products.type";

interface NearestStoreResponse {
  data: ProductResponse[];
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
  page: number;
  total: number;
  limit: number;
}

class ProductsService {
  private readonly basePath = "/products";

  async getProducts(
    page: number,
    storeId?: number,
    lat?: number,
    lon?: number
  ) {
    const params: Record<string, unknown> = {};
    if (typeof storeId === "number") params.storeId = storeId;
    else if (lat !== undefined && lon !== undefined) {
      params.lat = lat;
      params.lon = lon;
    }
    params.page = page;

    // Use apiClient.get(url, params) so axios handles querystring safely
    try {
      console.debug("products.getProducts params:", params);
    } catch {}
    const response = await apiClient.get<NearestStoreResponse>(
      this.basePath,
      params
    );
    try {
      console.debug(
        "products.getProducts nearest:",
        response.nearestStore,
        "message:",
        response.message
      );
    } catch {}

    // apiClient returns response data directly (see axios-client wrapper)
    const nearest = response.nearestStore ?? null;
    const hehe = response.data.map((product) => {
      const inventory = product.inventories?.[0];
      console.log(storeId);
      // Prefer the nearest store name (if the backend returned it) for consistency
      const storeName = nearest?.name ?? inventory?.store?.name ?? "Unknown";
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        isActive: Object.prototype.hasOwnProperty.call(product, "isActive")
          ? (product as unknown as { isActive?: boolean }).isActive
          : true,
        category: product.category.name,
        store: storeName,
        storeId: String(inventory?.store?.id ?? 1),
        imageUrl: product.images?.[0]?.imageUrl || "/placeholder.png",
        stock: inventory?.stockQty ?? 0,
      };
    });
    const hihi = response.data.flatMap((product) => {
      return (product.inventories ?? []).map((inventory) => {
        const storeName = nearest?.name ?? inventory?.store?.name ?? "Unknown";
        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          isActive: Object.prototype.hasOwnProperty.call(product, "isActive")
            ? (product as unknown as { isActive?: boolean }).isActive
            : true,
          category: product.category.name,
          store: storeName,
          storeId: String(inventory?.store?.id ?? 1),
          imageUrl: product.images?.[0]?.imageUrl || "/placeholder.png",
          stock: inventory?.stockQty ?? 0,
        };
      });
    });
    return {
      products: storeId ? hehe : hihi,
      nearestStore: nearest,
      message: response.message,
      total: response.total,
      limit: response.limit,
      page: response.page,
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
      stock: inventory?.stockQty ?? 0,
    };
  }

  async createProduct(data: FormData): Promise<ProductResponse> {
    const product = await apiClient.postForm<ProductResponse>(
      this.basePath,
      data
    );

    return product;
  }

  async updateProduct(slug: string, data: FormData): Promise<ProductResponse> {
    return await apiClient.putForm<ProductResponse>(
      `${this.basePath}/${slug}`,
      data
    );
  }

  async deleteProduct(slug: string) {
    await apiClient.delete(`${this.basePath}/${slug}`);
    return { message: "Product deleted successfully" };
  }

  async deactivateProduct(slug: string) {
    const resp = await apiClient.patch<{
      message: string;
      product?: ProductResponse;
    }>(`${this.basePath}/${slug}/deactivate`);
    return resp;
  }

  async activateProduct(slug: string) {
    const resp = await apiClient.patch<{
      message: string;
      product?: ProductResponse;
    }>(`${this.basePath}/${slug}/activate`);
    return resp;
  }
}

export const productsService = new ProductsService();
export const getProducts = (
  page: number,
  storeId?: number,
  lat?: number,
  lon?: number
) => productsService.getProducts(page, storeId, lat, lon);
export const getProductBySlug = (slug: string) =>
  productsService.getProductBySlug(slug);
export const createProduct = (data: FormData) =>
  productsService.createProduct(data);
export const updateProduct = (slug: string, data: FormData) =>
  productsService.updateProduct(slug, data);
export const deleteProduct = (slug: string) =>
  productsService.deleteProduct(slug);
