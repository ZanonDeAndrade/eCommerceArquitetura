import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();


// Listar todos os produtos
export const listarProdutos = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json(products);
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao listar produtos.",
      error: error.message,
    });
  }
};

// Listar produto por ID
export const listarProdutoId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: "Produto não encontrado." });
    }
  } catch (error: any) {
    console.error("Erro ao listar produto:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao listar produto.",
      error: error.message,
    });
  }
};

export const criarProduto = async (req: Request, res: Response) => {  
  try {
    const { name, price, stock } = req.body;
    console.log("Dados extraídos:", { name, price, stock });
    if (!name || price === undefined || stock === undefined) {
      console.log("❌ VALIDAÇÃO FALHOU");
      return res.status(400).json({
        message: "Nome, preço e estoque são obrigatórios",
        received: { name, price, stock }
      });
    }
    
    const newProduct = await prisma.product.create({
      data: {
        name: String(name),
        price: Number(price),
        stock: Number(stock),
      },
    });
    
    res.status(201).json(newProduct);
    
  } catch (error: any) {
    
    res.status(500).json({
      message: "Erro interno do servidor ao criar produto.",
      error: error.message,
    });
  }
};

// Atualizar produto por ID
export const atualizarProdutoId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, stock } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: name ?? product.name,
        price: price ?? product.price,
        stock: stock ?? product.stock,
      },
    });

    res.status(200).json(updatedProduct);
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao atualizar produto.",
      error: error.message,
    });
  }
};

// Deletar produto por ID
export const deletarProdutoId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar produto:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao deletar produto.",
      error: error.message,
    });
  }
};
