import express from "express";
import productsRouter from "./routes/productsRoutes.js";

const app = express();

app.use(express.json());

// Rotas
app.use("/products", productsRouter);

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
