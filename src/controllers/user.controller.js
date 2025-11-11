import bcrypt from "bcrypt";
import pool from "../db/connection.js";
import { userDecorator } from "../decorators/user.decorator.js";
import jwt  from 'jsonwebtoken';

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
    
    let newUser={};
    newUser.id = result.insertId;
    newUser.name = name;
    newUser.email = email;
    const token = jwt.sign({ id: result.insertId, email }, "palabra", { expiresIn: 60 });

    const userData = userDecorator(newUser);
    res.status(201).json({
      user: userData,token
    });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });        
  }
};