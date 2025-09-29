import "dotenv/config";
import express from "express";
import cors from "cors";
import userRoutes from "./routes/usersRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000; 
const HOST = "0.0.0.0";                         

app.use(cors());
app.use(express.json());
app.use("/users", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, HOST, () => {
  console.log(`User Service rodando na porta ${PORT}`);
});
