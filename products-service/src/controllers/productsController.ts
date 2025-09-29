import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Listar todos os produtos
export const listarProdutos = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json(products);
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error.message);
    res.status(500).json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Listar produto por ID
export const listarProdutoId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: "Produto não encontrado." });
    res.status(200).json(product);
  } catch (error: any) {
    console.error("Erro ao listar produto:", error.message);
    res.status(500).json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Criar produto
export const criarProduto = async (req: Request, res: Response) => {
  try {
    const { name, price, stock } = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: "Nome, preço e estoque são obrigatórios" });
    }
    const newProduct = await prisma.product.create({
      data: { name, price, stock },
    });
    res.status(201).json(newProduct);
  } catch (error: any) {
    console.error("Erro ao criar produto:", error.message);
    res.status(500).json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Atualizar produto por ID
export const atualizarProdutoId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    const { name, price, stock } = req.body;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: "Produto não encontrado." });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { name: name ?? product.name, price: price ?? product.price, stock: stock ?? product.stock },
    });
    res.status(200).json(updatedProduct);
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error.message);
    res.status(500).json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Deletar produto por ID
export const deletarProdutoId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: "Produto não encontrado." });
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar produto:", error.message);
    res.status(500).json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Decrementar estoque (para integração com Order Service)
export const decrementarEstoque = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    const { quantity } = req.body;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: "Produto não encontrado." });
    if (product.stock < quantity) return res.status(400).json({ message: "Estoque insuficiente." });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: { decrement: quantity } },
    });

    res.status(200).json(updatedProduct);
  } catch (error: any) {
    console.error("Erro ao decrementar estoque:", error.message);
    res.status(500).json({ message: "Erro interno do servidor", error: error.message });
  }
};
