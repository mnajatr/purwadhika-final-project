import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductBySlug,
  productsService,
  deleteProduct,
  updateProduct,
} from "../services/products.service";
import { ProductResponse } from "@/types/products.type";

export function useProducts(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ["products", lat, lon],
    queryFn: () => productsService.getProducts(lat, lon),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductResponse) =>
      productsService.createProduct(data).then((res) => res),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  type UpdatePayload = { slug: string; data: Record<string, unknown> };

  return useMutation({
    mutationFn: ({ slug, data }: UpdatePayload) => updateProduct(slug, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => deleteProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => productsService.deactivateProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useActivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => productsService.activateProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
