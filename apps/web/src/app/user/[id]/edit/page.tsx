"use client";

import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUsers";
import UpdateUserForm from "@/components/users/UpdateUserForm";

export default function UpdateUserPage() {
  const { id } = useParams();
  const { data: user, isLoading, error } = useUser(Number(id));

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Failed to load user</p>;
  if (!user) return <p>User not found</p>;

  const initialData = {
    email: user.email,
    password: "",
    role: user.role,
    profile: {
      fullName: user.profile?.fullName || "",
    },
  };

  return <UpdateUserForm userId={user.id} initialData={initialData} />;
}
