import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const HOST = "0.0.0.0";

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/", (_req, res) =>
  res.json({
    message: "E-commerce UI placeholder",
    docs: "Use o Kong em http://localhost:8000 para acessar os serviços.",
  }),
);

app.listen(PORT, HOST, () => {
  console.log(`UI Service rodando na porta ${PORT}`);
});
