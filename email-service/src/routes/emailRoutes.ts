import { Router } from "express";
import {
  enviarEmailConfirmacaoPagamento,
  enviarEmailCancelamentoPagamento,
  enviarEmailEstoqueBaixo,
} from "../controllers/emailController.js";

const router = Router();

router.post("/payment/confirmation", enviarEmailConfirmacaoPagamento);
router.post("/payment/cancellation", enviarEmailCancelamentoPagamento);
router.post("/inventory/low-stock", enviarEmailEstoqueBaixo);

export default router;
