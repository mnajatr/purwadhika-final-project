"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategory } from "@/services/category.service";
import { CreateCategoryInput, CreateCategorySchema } from "@repo/schemas";

export default function CreateCategoryForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      await createCategory(data);
      alert("✅ Category created successfully!");
      reset();
    } catch (err) {
      alert((err as Error)?.message ?? "❌ Failed to create category");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4 mt-10"
    >
      <h2 className="text-2xl font-bold mb-4">Create Category</h2>

      <div>
        <label className="block font-medium mb-1">Name</label>
        <input
          type="text"
          {...register("name")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-700"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          {...register("description")}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-700"
          rows={3}
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-gradient text-white py-2 rounded hover:bg-amber-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create Category"}
      </button>
    </form>
  );
}
