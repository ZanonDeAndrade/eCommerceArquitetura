import { Router } from "express";
import {
  criarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
} from "../controllers/usersController.js";
import { cacheMiddleware } from "../infra/cache/cacheMiddleware.js";

const router = Router();

router.post("/", criarUsuario);
router.get("/", listarUsuarios);
router.get("/:id", cacheMiddleware(60 * 60 * 24, (req) => `cache:user:${req.params.id}`), buscarUsuarioPorId);

export default router;
