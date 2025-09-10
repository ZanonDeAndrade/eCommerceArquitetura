import express from "express";
import productsRouter from "./routes/productsRoutes";
import ordersRouter from "./routes/orderRoutes";
import usersRouter from "./routes/userRoutes";
import paymentsRouter from "./routes/paymentRoutes"; 

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
