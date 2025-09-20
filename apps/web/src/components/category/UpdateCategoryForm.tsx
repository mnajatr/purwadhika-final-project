"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateCategorySchema, UpdateCategoryInput } from "@repo/schemas";
import { useUpdateCategory } from "@/hooks/useCategory";

interface UpdateCategoryFormProps {
  id: number;
  initialData: UpdateCategoryInput;
  onSuccess?: () => void;
}

export default function UpdateCategoryForm({
  id,
  initialData,
  onSuccess,
}: UpdateCategoryFormProps) {
  const updateCategoryMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(UpdateCategorySchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  const onSubmit = async (data: UpdateCategoryInput) => {
    try {
      await updateCategoryMutation.mutateAsync({ id, data });
      alert("✅ Category updated successfully!");
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || "❌ Failed to update category");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4 mt-10"
    >
      <h2 className="text-2xl font-bold mb-4">Update Category</h2>

      {/* Name */}
      <div>
        <label className="block font-medium mb-1">Name</label>
        <input
          type="text"
          {...register("name")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          {...register("description")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
          rows={3}
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {isSubmitting ? "Updating..." : "Update Category"}
      </button>
    </form>
  );
}
