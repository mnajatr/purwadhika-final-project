import { prisma } from "@repo/database";

export class CategoryService {
  // ================= GET ALL CATEGORIES =================
  async getAll() {
    return prisma.productCategory.findMany();
  }

  // ================= GET ALL WITH PAGINATION =================
  async getAllPaginated(page: number = 0, limit: number = 10) {
    const skip = page === 0 ? 0 : (page - 1) * limit;
    const [categories, total] = await Promise.all([
      prisma.productCategory.findMany({
        skip,
        take: page === 0 ? undefined : limit,
      }),
      prisma.productCategory.count(),
    ]);

    return {
      data: categories,
      total,
      page,
      limit,
    };
  }

  // ================= GET CATEGORY BY ID =================
  async getById(id: number) {
    const category = await prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) throw new Error(`Category with id ${id} not found`);
    return category;
  }

  // ================= CREATE CATEGORY =================
  async create(name: string, description?: string) {
    const existing = await prisma.productCategory.findUnique({
      where: { name },
    });
    if (existing) throw new Error("Category already exists");

    return prisma.productCategory.create({
      data: { name, description },
    });
  }

  // ================= UPDATE CATEGORY =================
  async update(id: number, name: string, description?: string) {
    const existing = await prisma.productCategory.findUnique({
      where: { name },
    });
    if (existing && existing.id !== id)
      throw new Error("Category already exists");

    return prisma.productCategory.update({
      where: { id },
      data: { name, description },
    });
  }

  // ================= DELETE CATEGORY =================
  async delete(id: number) {
    return prisma.productCategory.delete({ where: { id } });
  }
}
