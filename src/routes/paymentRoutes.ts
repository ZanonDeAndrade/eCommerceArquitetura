
import { Router } from "express";
import {
  confirmarPagamento,
  buscarPagamentosDoPedido,
  atualizarEstoque,
} from "../controllers/paymentController.js";

const router = Router();

// Rotas de pagamento 
router.post("/confirm", confirmarPagamento);      // POST /payments/confirm
router.get("/:orderId", buscarPagamentosDoPedido); // GET /payments/:orderId
router.post("/update-stock", atualizarEstoque);   // POST /payments/update-stock

export default router;
