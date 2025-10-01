import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import usersService from "@/services/users.service";
import { UserResponse } from "@/types/user.types";
import { UserAddressResponse } from "@/types/address.type";
import { paginationData } from "@/services/category.service";

export function useUsers(page: number) {
  return useQuery<paginationData<UserResponse[]>>({
    queryKey: ["users", page],
    queryFn: () => usersService.getUsers(page),
  });
}

export function useUser(id: number) {
  return useQuery<UserResponse>({
    queryKey: ["users", id],
    queryFn: () => usersService.getUser(id),
    enabled: !!id,
  });
}

export function useUserAddresses(id: number) {
  return useQuery<UserAddressResponse[]>({
    queryKey: ["users", id, "addresses"],
    queryFn: () => usersService.getUserAddresses(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] }); // refresh list user
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserResponse> }) =>
      usersService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", updatedUser.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
