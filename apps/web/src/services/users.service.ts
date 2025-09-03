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

const usersService = {
  getUsers,
};

export default usersService;
