"use client";

import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUsers";
import UpdateUserForm from "@/components/users/UpateUserForm";

export default function UpdateUserFormm() {
  const { id } = useParams();
  const { data: user, isLoading, error } = useUser(Number(id));

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Gagal load User</p>;
  if (!user) return <p>User tidak ditemukan</p>;

  return <UpdateUserForm user={user} />;
}
