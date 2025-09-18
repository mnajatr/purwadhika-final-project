"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserSchema } from "@repo/schemas";
import { z } from "zod";
import { updateUser } from "@/services/users.service";

type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

interface UpdateUserFormProps {
  userId: number;
  initialData: UpdateUserInput; // data user untuk pre-fill
}

export default function UpdateUserForm({
  userId,
  initialData,
}: UpdateUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: UpdateUserInput) => {
    try {
      await updateUser(userId, data);
      alert("✅ User updated successfully!");
    } catch (err: any) {
      alert(err.message || "❌ Failed to update user");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto space-y-4 p-6 bg-white rounded-lg shadow"
    >
      <h2 className="text-xl font-bold">Update User</h2>

      {/* Email */}
      <div>
        <label className="block font-medium">Email</label>
        <input
          type="email"
          {...register("email")}
          className="w-full border p-2 rounded"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block font-medium">Password</label>
        <input
          type="password"
          {...register("password")}
          className="w-full border p-2 rounded"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label className="block font-medium">Role</label>
        <select {...register("role")} className="w-full border p-2 rounded">
          <option value="USER">USER</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="STORE_ADMIN">STORE_ADMIN</option>
        </select>
        {errors.role && (
          <p className="text-red-500 text-sm">{errors.role.message}</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label className="block font-medium">Full Name</label>
        <input
          type="text"
          {...register("profile.fullName")}
          className="w-full border p-2 rounded"
        />
        {errors.profile?.fullName && (
          <p className="text-red-500 text-sm">
            {errors.profile.fullName.message}
          </p>
        )}
      </div>

      {/* Avatar URL */}
      <div>
        <label className="block font-medium">Avatar URL</label>
        <input
          type="text"
          {...register("profile.avatarUrl")}
          className="w-full border p-2 rounded"
        />
        {errors.profile?.avatarUrl && (
          <p className="text-red-500 text-sm">
            {errors.profile.avatarUrl.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {isSubmitting ? "Updating..." : "Update User"}
      </button>
    </form>
  );
}
