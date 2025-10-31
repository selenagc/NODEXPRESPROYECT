import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API To-Do List funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Servidor corriendo en http://localhost:${PORT}`));
