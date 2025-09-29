import { Router } from "express";
import {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  buscarPedidosDoUsuario,
  atualizarStatusPedido,
} from "../controllers/orderController.js";

const router = Router();

router.post("/", criarPedido);
router.get("/", listarPedidos);
router.get("/user/:userId", buscarPedidosDoUsuario);
router.get("/:id", buscarPedidoPorId);
router.patch("/:id/status", atualizarStatusPedido);

export default router;
