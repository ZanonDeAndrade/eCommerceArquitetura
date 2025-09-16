import express from "express";
import cors from "cors";
import paymentRoutes from "./routes/paymentRoutes";

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());
app.use("/payments", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Payment Service rodando na porta ${PORT}`);
});
