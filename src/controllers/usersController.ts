import { PrismaClient, User } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Criar novo usuário
export const criarUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email }: { name: string; email: string } = req.body;

    if (!name || !email) {
      res.status(400).json({ message: "Nome e email são obrigatórios" });
      return;
    }

    // Verificar se email já existe
    const existingUser: User | null = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ message: "Email já está em uso" });
      return;
    }

    const newUser: User = await prisma.user.create({
      data: { name, email },
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao criar usuário.",
      error: error.message,
    });
  }
};

// Listar todos os usuários.
export const listarUsuarios = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    res.status(200).json(users);
  } catch (error: any) {
    console.error("Erro ao listar usuários:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao listar usuários.",
      error: error.message,
    });
  }
};

// Buscar usuário por ID
export const buscarUsuarioPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id: number = Number(req.params.id);

    const user: (User & {
      orders: {
        items: {
          product: { name: string; price: number };
          quantity: number;
          subtotal: number;
        }[];
        total: number;
        createdAt: Date;
      }[];
    }) | null = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: { select: { name: true, price: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado." });
      return;
    }

    res.status(200).json(user);
  } catch (error: any) {
    console.error("Erro ao buscar usuário:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao buscar usuário.",
      error: error.message,
    });
  }
};
