import bcrypt from "bcrypt";
import pool from "../db/connection.js";
import { userDecorator } from "../decorators/user.decorator.js";
import jwt from 'jsonwebtoken';
import { generateToken } from "../utils/jwt.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(422).json({ message: "Todos los campos son obligatorios" });
    }

    const [existingUser] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return res.status(422).json({ message: "Usuario existente" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    let newUser = {};
    newUser.id = result.insertId;
    newUser.name = name;
    newUser.email = email;
    const token = jwt.sign({ id: result.insertId, email }, "palabra", { expiresIn: 60 });
    const userData = userDecorator(newUser);

    res.status(201).json({
      data: {
        token,
        user: userData
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios" });
    }

    const [users] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const userData = userDecorator(user);

    const token = generateToken(userData);

    res.json({
      token,
      user: userData
    });

  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
