import { Router } from "express";
import {
  listarMetodosPagamento,
  confirmarPagamento,
  buscarPagamentosDoPedido,
} from "../controllers/paymentsController";

const router = Router();

router.get("/methods", listarMetodosPagamento);
router.post("/confirm", confirmarPagamento);
router.get("/order/:orderId", buscarPagamentosDoPedido);

export default router;
