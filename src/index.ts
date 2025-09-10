import express from "express";
import productsRouter from "./routes/productsRoutes.js";
import ordersRouter from "./routes/orderRoutes.js";
import usersRouter from "./routes/userRoutes.js";
import paymentsRouter from "./routes/paymentRoutes.js"; 

const app = express();

app.use(express.json());

// Rotas
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);
app.use("/users", usersRouter);
app.use("/payments", paymentsRouter); 

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
