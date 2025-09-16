import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductBySlug,
  productsService,
  deleteProduct,
  updateProduct,
} from "../services/products.service";
import { ProductResponse } from "@/types/products.type";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => productsService.getProducts(),
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
    mutationFn: (data: any) =>
      productsService.createProduct(data).then((res) => res),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      data,
    }: {
      slug: string;
      data: Partial<ProductResponse>;
    }) => updateProduct(slug, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
    },
  });
}

// 🔹 Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => deleteProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// export function useUpdateProduct() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({ id, ...data }: any) =>
//       productsService.update(id, data).then((res) => res.data),
//     onSuccess: (_, { id }) => {
//       queryClient.invalidateQueries({ queryKey: ["products"] });
//       queryClient.invalidateQueries({ queryKey: ["product", id] });
//     },
//   });
// }

// export function useDeleteProduct() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) =>
//       productsService.delete(id).then((res) => res.data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products"] });
//     },
//   });
// }
