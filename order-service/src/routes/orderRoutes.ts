import { Router } from "express";
import {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  buscarPedidosDoUsuario,
  atualizarStatusPedido,
} from "../controllers/orderController.js";
import { cacheMiddleware } from "../infra/cache/cacheMiddleware.js";

const router = Router();

router.post("/", criarPedido);
router.get("/", listarPedidos);
router.get("/user/:userId", buscarPedidosDoUsuario);
router.get("/:id", cacheMiddleware(60 * 60 * 24 * 30, (req) => `cache:order:${req.params.id}`), buscarPedidoPorId);
router.patch("/:id/status", atualizarStatusPedido);

export default router;
