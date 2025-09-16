import express from "express";
import cors from "cors";
import ordersRoutes from "./routes/orderRoutes";

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());
app.use("/orders", ordersRoutes);

app.listen(PORT, () => {
  console.log(`Order Service rodando na porta ${PORT}`);
});
