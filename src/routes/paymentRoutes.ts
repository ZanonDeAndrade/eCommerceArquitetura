import { Router } from "express";
import {
  listarMetodosPagamento,
  confirmarPagamento,
  buscarPagamentosDoPedido,
} from "../controllers/paymentController";

const router = Router();

// Rotas de pagamento
router.get("/methods", listarMetodosPagamento);          // GET /payments/methods
router.post("/confirm", confirmarPagamento);            // POST /payments/confirm
router.get("/order/:orderId", buscarPagamentosDoPedido); // GET /payments/order/:orderId

export default router;
