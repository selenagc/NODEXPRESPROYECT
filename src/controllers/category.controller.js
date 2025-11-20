import { v4 as uuidv4 } from "uuid";
import db from "../db/connection.js";
import { decorateCategory } from "../decorators/category.decorator.js";


export async function store(req, res) {
  try {
    const { nombre } = req.body;
    const user_id = req.user.id;
    if (!nombre) {
      return res.status(400).json({ message: "Falta nombre" });
    }

    const [existing] = await db.query(
      "SELECT * FROM categories WHERE name = ? AND user_id = ?",
      [nombre, user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "La categoría ya existe" });
    }

    const id = uuidv4();
    await db.query("INSERT INTO categories (id, name, user_id) VALUES (?, ?, ?)", [id, nombre, user_id]);

    res.status(201).json(decorateCategory({ id, nombre, user_id }));
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });

  }
}

export async function index(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const offset = (page - 1) * perPage;
    const user_id = req.user.id;
    const [rows] = await db.query("SELECT * FROM categories WHERE user_id =?",
      [user_id]);

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM categories WHERE user_id = ?',
      [user_id]
    );
    const decorated = rows.map(decorateCategory);
    res.json(
      decorated);
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

export async function show(req, res) {
  try {
    const user_id = req.user.id;
    const categoryId = req.params.id;
    const [category] = await db.query('SELECT * FROM categories WHERE id = ? and user_id =?', [categoryId, user_id]);
    if (category.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(decorateCategory(category[0]));
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const user_id = req.user.id;
    if (!nombre) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }
    const [existing] = await db.query("SELECT * FROM categories WHERE id = ? AND user_id =?", [id, user_id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    const [duplicate] = await db.query(
      "SELECT * FROM categories WHERE name = ? AND id != ?",
      [nombre, id]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: "Ya existe otra categoría con ese nombre" });
    }

    await db.query("UPDATE categories SET name = ? WHERE id = ?", [nombre, id]);
    const [update] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    res.json(decorateCategory(update[0]));
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

export async function destroy(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const [existing] = await db.query("SELECT * FROM categories WHERE id = ? AND user_id =?", [id, user_id]);
    const backup = existing
    if (existing.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    await db.query("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ data: decorateCategory(backup[0]) });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }

}