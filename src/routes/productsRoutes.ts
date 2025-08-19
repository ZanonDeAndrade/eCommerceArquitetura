import { Router } from "express";
import { listarPedidos } from "../controllers/productsController.js";

const router = Router();

router.get("/", listarPedidos);

export default router;
