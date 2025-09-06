import { apiClient } from "@/lib/axios-client";

export interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  profile?: {
    fullName?: string;
  } | null;
}

export async function getUsers(): Promise<User[]> {
  return apiClient.get<User[]>("/users");
}

export async function getUser(id: number): Promise<User> {
  return apiClient.get<User>(`/users/${id}`);
}

export async function getUserAddresses(id: number): Promise<unknown[]> {
  return apiClient.get<unknown[]>(`/users/${id}/addresses`);
}

const usersService = {
  getUsers,
  getUser,
  getUserAddresses,
};

export default usersService;
