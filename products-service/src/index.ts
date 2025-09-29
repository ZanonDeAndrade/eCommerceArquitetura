import "dotenv/config";
import express from "express";
import cors from "cors";
import productsRoutes from "./routes/productsRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.use(cors());
app.use(express.json());
app.use("/products", productsRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, HOST, () => {
  console.log(`Product Service rodando na porta ${PORT}`);
});
