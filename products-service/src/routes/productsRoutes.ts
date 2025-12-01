import { Router } from "express";
import {
  listarProdutos,
  listarProdutoId,
  criarProduto,
  atualizarProdutoId,
  deletarProdutoId,
  atualizarEstoqueProduto,
} from "../controllers/productsController.js";
import { cacheMiddleware } from "../infra/cache/cacheMiddleware.js";

const router = Router();

router.get("/", cacheMiddleware(60 * 60 * 4, () => "cache:products:all"), listarProdutos);
router.get("/:id", listarProdutoId);
router.post("/", criarProduto);
router.put("/:id", atualizarProdutoId);
router.delete("/:id", deletarProdutoId);
router.patch("/:id/stock", atualizarEstoqueProduto);

export default router;
