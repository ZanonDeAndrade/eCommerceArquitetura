// productsRoutes.js - CORRETO
import { Router } from "express";
import {
  listarProdutos,
  listarProdutoId,
  criarProduto,
  atualizarProdutoId,
  deletarProdutoId,
} from "../controllers/productsController.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();



// Rotas para produtos (sem /products, pois já está no app.use)
router.get("/", listarProdutos);           // GET /products
router.get("/:id", listarProdutoId);       // GET /products/:id
router.post("/", criarProduto);            // POST /products
router.put("/:id", atualizarProdutoId);    // PUT /products/:id
router.delete("/:id", deletarProdutoId);   // DELETE /products/:id

export default router;