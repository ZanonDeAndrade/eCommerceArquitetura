import { Router } from "express";
import {
  listarMetodosPagamento,
  confirmarPagamento,
  buscarPagamentosDoPedido,
} from "../controllers/paymentsController.js";
import { cacheMiddleware } from "../infra/cache/cacheMiddleware.js";

const router = Router();

router.get("/methods", cacheMiddleware(null, () => "cache:payments:types"), listarMetodosPagamento);
router.get("/types", cacheMiddleware(null, () => "cache:payments:types"), listarMetodosPagamento);
router.post("/confirm", confirmarPagamento);
router.get("/order/:orderId", buscarPagamentosDoPedido);

export default router;
