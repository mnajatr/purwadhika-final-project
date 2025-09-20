export type ProductCategoryResponse = {
  id: number;
  name: string;
  description?: string;
};

export interface ProductCategoryInput {
  name: string;
  description?: string;
}
