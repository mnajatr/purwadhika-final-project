"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUser } from "@/services/users.service";
import { CreateUserSchema } from "@repo/schemas";

type CreateUserInput = z.infer<typeof CreateUserSchema>;

export default function CreateUserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "USER",
      profile: {
        fullName: "",
        avatarUrl: "",
      },
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    try {
      await createUser(data);
      alert("✅ User created successfully!");
      reset();
    } catch (err: any) {
      alert(err.message || "❌ Failed to create user");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4 mt-10"
    >
      <h2 className="text-2xl font-bold mb-4">Create User</h2>

      {/* Email */}
      <div>
        <label className="block font-medium mb-1">Email</label>
        <input
          type="email"
          {...register("email")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block font-medium mb-1">Password</label>
        <input
          type="password"
          {...register("password")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label className="block font-medium mb-1">Role</label>
        <select
          {...register("role")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
        >
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
        <label className="block font-medium mb-1">Full Name</label>
        <input
          type="text"
          {...register("profile.fullName")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
        />
        {errors.profile?.fullName && (
          <p className="text-red-500 text-sm">
            {errors.profile.fullName.message}
          </p>
        )}
      </div>

      {/* Avatar URL */}
      <div>
        <label className="block font-medium mb-1">Avatar URL</label>
        <input
          type="text"
          {...register("profile.avatarUrl")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
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
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
