import { apiClient } from "@/lib/axios-client";
import { UserResponse } from "@/types/user.types";
import { UserAddressResponse } from "@/types/address.type";

export async function getUsers(): Promise<UserResponse[]> {
  return apiClient.get<UserResponse[]>("/users");
}

export async function getUser(id: number): Promise<UserResponse> {
  return apiClient.get<UserResponse>(`/users/${id}`);
}

export async function getUserAddresses(
  id: number
): Promise<UserAddressResponse[]> {
  return apiClient.get<UserAddressResponse[]>(`/users/${id}/addresses`);
}

export async function createUser(
  data: Omit<UserResponse, "id" | "createdAt" | "updatedAt">
): Promise<UserResponse> {
  return apiClient.post<UserResponse>("/users", data);
}

export async function updateUser(
  id: number,
  data: Partial<UserResponse>
): Promise<UserResponse> {
  return apiClient.put<UserResponse>(`/users/${id}`, data);
}

export async function deleteUser(id: number): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/users/${id}`);
}

const usersService = {
  getUsers,
  getUser,
  getUserAddresses,
  createUser,
  updateUser,
  deleteUser,
};

export default usersService;
