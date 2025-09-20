import apiClient from "@/lib/axios-client";
import { ProductCategoryResponse } from "@/types/category.type";

class CategoriesService {
  private readonly basePath = "/category";

  async getCategories() {
    const categories = await apiClient.get<ProductCategoryResponse[]>(
      this.basePath
    );
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
export const getCategories = () => categoriesService.getCategories();
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
