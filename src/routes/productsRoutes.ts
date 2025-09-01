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




// No seu productsRoutes.js, adicione:
// productsRoutes.js - adicione temporariamente
router.get("/test-connection", async (req, res) => {
    try {
      await prisma.$connect();
      res.json({ message: "Conexão OK com o banco" });
    } catch (error: any) {
      console.error("Erro na conexão:", error);
      res.status(500).json({ error: error.message });
    }
  });


// Rotas para produtos (sem /products, pois já está no app.use)
router.get("/", listarProdutos);           // GET /products
router.get("/:id", listarProdutoId);       // GET /products/:id
router.post("/", criarProduto);            // POST /products
router.put("/:id", atualizarProdutoId);    // PUT /products/:id
router.delete("/:id", deletarProdutoId);   // DELETE /products/:id

export default router;