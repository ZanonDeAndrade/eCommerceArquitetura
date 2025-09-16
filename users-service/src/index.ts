import express from "express";
import cors from "cors";
import userRoutes from "./routes/usersRoutes";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use("/users", userRoutes);

app.listen(PORT, () => {
  console.log(`User Service rodando na porta ${PORT}`);
});
