import { Router } from "express";
import {
  criarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
} from "../controllers/usersController.ts";

const router = Router();

// Rotas para usuários
router.post("/", criarUsuario);          // POST /users - Criar usuário
router.get("/", listarUsuarios);         // GET /users - Listar todos os usuários
router.get("/:id", buscarUsuarioPorId);  // GET /users/:id - Buscar usuário por ID

export default router;
