import { useQuery } from "@tanstack/react-query";
import usersService from "@/services/users.service";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
  });
}
