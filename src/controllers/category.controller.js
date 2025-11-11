import { v4 as uuidv4 } from "uuid";
import db from "../db/connection.js";
import { decorateCategory } from "../decorators/category.decorator.js";


export async function store(req, res) {
  try {
    const { name } = req.body;
    //const userId = req.user.id;
    const user_id = 966;
    if (!name || !user_id) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const [existing] = await db.query(
      "SELECT * FROM categories WHERE name = ? AND user_id = ?",
      [name, user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "La categoría ya existe" });
    }

    const id = uuidv4();
    await db.query("INSERT INTO categories (id, name, user_id) VALUES (?, ?, ?)", [id, name, user_id]);

    res.status(201).json({
      data: decorateCategory({ id, name, user_id }),
    });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  
  }
}

export async function index(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM categories");
    const decorated = rows.map(decorateCategory);
    res.json({data:decorated});
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
    
  }
}

export async function show (req, res) {
    try {
        const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (category.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json({ data: decorateCategory(category[0]) });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }
    const [existing] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    const [duplicate] = await db.query(
      "SELECT * FROM categories WHERE name = ? AND id != ?",
      [name, id]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: "Ya existe otra categoría con ese nombre" });
    }

    await db.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
    const [update] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    res.json({data:decorateCategory(update[0])});
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

export async function destroy(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    const backup=existing
    if (existing.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    await db.query("DELETE FROM categories WHERE id = ?", [id]);
    res.json({data:decorateCategory(backup[0])});
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }

}