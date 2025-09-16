import express from "express";
import cors from "cors";
import productsRoutes from "./routes/productsRoutes";

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());
app.use("/products", productsRoutes);

app.listen(PORT, () => {
  console.log(`Product Service rodando na porta ${PORT}`);
});
