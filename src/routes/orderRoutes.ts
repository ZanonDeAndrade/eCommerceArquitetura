import { Router } from "express";
import {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  buscarPedidosDoUsuario,
} from "../controllers/ordersController";

const router = Router();

// Rotas para pedidos
router.post("/", criarPedido);                         // POST /orders - Criar pedido
router.get("/", listarPedidos);                        // GET /orders - Listar todos os pedidos
router.get("/user/:userId", buscarPedidosDoUsuario);  // GET /orders/user/:userId - Pedidos de um usuário
router.get("/:id", buscarPedidoPorId);                // GET /orders/:id - Buscar pedido por ID

export default router;
