import { Router } from "express";
import {
  listarProdutos,
  listarProdutoId,
  criarProduto,
  atualizarProdutoId,
  deletarProdutoId,
  decrementarEstoque,
} from "../controllers/productsController.js";

const router = Router();

router.get("/", listarProdutos);
router.get("/:id", listarProdutoId);
router.post("/", criarProduto);
router.put("/:id", atualizarProdutoId);
router.delete("/:id", deletarProdutoId);
router.patch("/:id/decrement-stock", decrementarEstoque);

export default router;
