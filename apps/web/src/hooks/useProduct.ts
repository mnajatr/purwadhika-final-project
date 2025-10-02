import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductBySlug,
  productsService,
  deleteProduct,
} from "../services/products.service";

export function useProducts(
  page: number,
  storeId?: number,
  lat?: number,
  lon?: number
) {
  return useQuery({
    queryKey: ["products", page, storeId, lat, lon],
    queryFn: () => productsService.getProducts(page, storeId, lat, lon),
    //placeholderData: (prev) => prev,
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
    mutationFn: (data: FormData) =>
      productsService.createProduct(data).then((res) => res),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
