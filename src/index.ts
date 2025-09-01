import express from "express";
import productsRouter from "./routes/productsRoutes.js";
import ordersRouter from "./routes/orderRoutes.js";    // ← Novo
import usersRouter from "./routes/userRoutes.js"; 

const app = express();

app.use(express.json());

// Rotas
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);
app.use("/users", usersRouter);

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
