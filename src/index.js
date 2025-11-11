import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});