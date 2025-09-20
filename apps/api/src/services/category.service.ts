import { prisma } from "@repo/database";

export async function getCategories() {
  return prisma.productCategory.findMany();
}

export async function getCategoryById(id: number) {
  const category = await prisma.productCategory.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error(`Category with id ${id} not found`);
  }

  return category;
}

export async function createCategory(name: string, description: string) {
  const existing = await prisma.productCategory.findUnique({ where: { name } });
  if (existing) throw new Error("Category already exists");

  return prisma.productCategory.create({
    data: { name, description },
  });
}

export async function updateCategory(
  id: number,
  name: string,
  description?: string
) {
  const existing = await prisma.productCategory.findUnique({ where: { name } });
  if (existing && existing.id !== id)
    throw new Error("Category already exists");

  return prisma.productCategory.update({
    where: { id },
    data: { name, description },
  });
}

export async function deleteCategory(id: number) {
  return prisma.productCategory.delete({ where: { id } });
}
