import apiClient from "@/lib/axios-client";
import { ProductCategoryResponse } from "@/types/category.type";

export interface paginationData<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
}

class CategoriesService {
  private readonly basePath = "/category";

  async getCategories(page: number) {
    const params: Record<string, unknown> = {};
    params.page = page;
    const categories = await apiClient.get<
      paginationData<ProductCategoryResponse[]>
    >(this.basePath, params);
    return categories;
  }

  async getCategoryById(id: number) {
    const category = await apiClient.get<ProductCategoryResponse>(
      `${this.basePath}/${id}`
    );
    return category;
  }

  async createCategory(data: { name: string; description?: string }) {
    const category = await apiClient.post<ProductCategoryResponse>(
      this.basePath,
      data
    );
    return category;
  }

  async updateCategory(
    id: number,
    data: { name: string; description?: string }
  ) {
    const category = await apiClient.put<ProductCategoryResponse>(
      `${this.basePath}/${id}`,
      data
    );
    return category;
  }

  async deleteCategory(id: number) {
    await apiClient.delete(`${this.basePath}/${id}`);
    return { message: "Category deleted successfully" };
  }
}

export const categoriesService = new CategoriesService();
export const getCategories = (page: number) =>
  categoriesService.getCategories(page);
export const getCategoryById = (id: number) =>
  categoriesService.getCategoryById(id);
export const createCategory = (data: { name: string; description?: string }) =>
  categoriesService.createCategory(data);
export const updateCategory = (
  id: number,
  data: { name: string; description?: string }
) => categoriesService.updateCategory(id, data);
export const deleteCategory = (id: number) =>
  categoriesService.deleteCategory(id);
