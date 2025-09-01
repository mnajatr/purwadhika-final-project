import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  profile?: {
    fullName?: string;
  } | null;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.get<User[]>("/users"),
  });
}
