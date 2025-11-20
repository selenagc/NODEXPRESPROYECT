import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import tagRoutes from './routes/tag.routes.js';
import tasksRoutes from './routes/task.routes.js';
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/categorias", categoryRoutes);
app.use('/api/etiquetas', tagRoutes);
app.use("/api/tareas", tasksRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});