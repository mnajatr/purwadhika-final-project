import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../services/products.service";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
};
