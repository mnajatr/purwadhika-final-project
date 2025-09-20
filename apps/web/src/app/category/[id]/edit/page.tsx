"use client";

import Sidebar from "@/components/admin/sidebar";
import { useParams } from "next/navigation";
import { useCategory } from "@/hooks/useCategory";
import UpdateCategoryForm from "@/components/category/UpdateCategoryForm";

export default function UpdateCategoryPage() {
  const { id } = useParams(); // ambil id dari URL
  const categoryId = Number(id);
  const { data: category, isLoading, error } = useCategory(categoryId);

  if (isLoading) return <p>Loading category...</p>;
  if (error) return <p className="text-red-500">Failed to load category</p>;
  if (!category) return <p>Category not found</p>;

  const initialData = {
    name: category.name,
    description: category.description || "",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 px-6 py-12">
        <UpdateCategoryForm id={categoryId} initialData={initialData} />
      </div>
    </div>
  );
}
