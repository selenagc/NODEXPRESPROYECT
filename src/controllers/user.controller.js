import bcrypt from "bcrypt";
import pool from "../db/connection.js";
import { userDecorator } from "../decorators/user.decorator.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(422).json({ message: "Todos los campos son obligatorios" });
    }

    const [existingUser] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    const newUser = { name: name, email: email };
    res.status(201).json(userDecorator(newUser));
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};