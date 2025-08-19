import { Request, Response } from "express";
import { products } from "../models/productsModels.js";

export const listarPedidos = async (req: Request, res: Response) => {
  try {
    res.status(200).json(products);
  } catch (error: any) {
    console.error("Erro ao listar pedidos:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao listar pedidos.",
      error: error.message,
    });
  }
};
