import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  discountsService,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../services/discount.service";
import {
  DiscountResponse,
  CreateDiscount,
  UpdateDiscount,
} from "../types/discount.types";

export function useDiscounts() {
  return useQuery({
    queryKey: ["discounts"],
    queryFn: () => discountsService.getDiscounts(),
  });
}

export function useDiscount(id: number) {
  return useQuery({
    queryKey: ["discount", id],
    queryFn: () => getDiscountById(id),
    enabled: !!id,
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDiscount) => createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDiscount }) =>
      updateDiscount(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      queryClient.invalidateQueries({ queryKey: ["discount", variables.id] });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}
