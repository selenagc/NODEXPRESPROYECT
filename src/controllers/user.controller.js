import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import pool from "../db/connection.js";
import { userDecorator } from "../decorators/user.decorator.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const [existingUser] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await pool.query(
      "INSERT INTO user (id, name, email, password) VALUES (?, ?, ?, ?)",
      [id, name, email, hashedPassword]
    );

    const [rows] = await pool.query("SELECT id, name, email FROM user WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(500).json({ message: "Error interno del servidor" });
    }

    const newUser = rows[0];
    res.status(201).json(userDecorator(newUser));

  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};