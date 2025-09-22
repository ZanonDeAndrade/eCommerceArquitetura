import { Router } from "express";
import {
  criarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
} from "../controllers/usersController.js";

const router = Router();

router.post("/", criarUsuario);
router.get("/", listarUsuarios);
router.get("/:id", buscarUsuarioPorId);

export default router;
