import { Request, Response } from "express";
import * as categoryService from "../services/category.service.js";

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await categoryService.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCategoryById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(Number(id));
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const category = await categoryService.createCategory(name, description);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const category = await categoryService.updateCategory(
      Number(id),
      name,
      description
    );
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(Number(id));
    res.json({ message: "Category deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
