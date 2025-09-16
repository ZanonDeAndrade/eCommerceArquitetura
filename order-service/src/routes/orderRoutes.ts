import { Router } from "express";
import {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  buscarPedidosDoUsuario,
} from "../controllers/orderController";

const router = Router();

router.post("/", criarPedido);
router.get("/", listarPedidos);
router.get("/user/:userId", buscarPedidosDoUsuario);
router.get("/:id", buscarPedidoPorId);

export default router;
