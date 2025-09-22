import { Request, Response } from "express";
import * as reportService from "../services/report.service.js";

// Sales report
export async function getSalesReport(req: Request, res: Response) {
  try {
    const { storeId, month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "month and year are required" });
    }

    const report = await reportService.getSalesReport({
      storeId: storeId ? Number(storeId) : undefined,
      month: Number(month),
      year: Number(year),
    });

    res.json({ data: report });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getSalesByCategory(req: Request, res: Response) {
  try {
    const { storeId, month, year } = req.query;
    if (!month || !year)
      return res.status(400).json({ message: "month and year are required" });

    const report = await reportService.getSalesByCategory({
      storeId: storeId ? Number(storeId) : undefined,
      month: Number(month),
      year: Number(year),
    });

    res.json({ data: report });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getSalesByProduct(req: Request, res: Response) {
  try {
    const { storeId, month, year } = req.query;
    if (!month || !year)
      return res.status(400).json({ message: "month and year are required" });

    const report = await reportService.getSalesByProduct({
      storeId: storeId ? Number(storeId) : undefined,
      month: Number(month),
      year: Number(year),
    });

    res.json({ data: report });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Stock report
export async function getStockSummary(req: Request, res: Response) {
  try {
    const { storeId, month, year } = req.query;
    if (!storeId || !month || !year) {
      return res
        .status(400)
        .json({ message: "storeId, month, and year are required" });
    }

    const report = await reportService.getStockSummary({
      storeId: Number(storeId),
      month: Number(month),
      year: Number(year),
    });

    res.json({ data: report });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getStockDetail(req: Request, res: Response) {
  try {
    const { storeId, month, year } = req.query;
    if (!storeId || !month || !year) {
      return res
        .status(400)
        .json({ message: "storeId, month, and year are required" });
    }

    const report = await reportService.getStockDetail({
      storeId: Number(storeId),
      month: Number(month),
      year: Number(year),
    });

    res.json({ data: report });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
