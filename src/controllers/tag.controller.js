import { v4 as uuidv4 } from "uuid";
import db from "../db/connection.js";
import { tagDecorator } from "../decorators/tag.decorator.js";


export async function store(req, res) {
  try {
    const { nombre } = req.body;
    const user_id = req.user.id;
    if (!nombre) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const [existing] = await db.query(
      "SELECT * FROM tags WHERE name = ? AND user_id = ?",
      [nombre, user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "La Etiqueta ya existe" });
    }

    const id = uuidv4();
    await db.query("INSERT INTO tags (id, name, user_id) VALUES (?, ?, ?)", [id, nombre, user_id]);

    res.status(201).json(tagDecorator({ id, nombre, user_id }));
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
    const [rows] = await db.query("SELECT * FROM tags WHERE user_id=?", [user_id]);

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM tags WHERE user_id = ?',
      [user_id]
    );
    const decorated = rows.map(tagDecorator);
    res.json(decorated);
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });

  }
}

export async function show(req, res) {
  try {
    const user_id = req.user.id;
    const tagId = req.params.id;
    const [tag] = await db.query('SELECT * FROM tags WHERE id = ? and user_id = ?', [tagId, user_id]);
    if (tag.length === 0) {
      return res.status(404).json({ message: "Etiqueta not found" });
    }x
    res.json({ data: tagDecorator(tag[0]) });
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
    const [existing] = await db.query("SELECT * FROM tags WHERE id = ? and user_id = ?", [id, user_id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Etiqueta no encontrada" });
    }

    const [duplicate] = await db.query(
      "SELECT * FROM tags WHERE name = ? AND id != ?",
      [nombre, id]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: "Ya existe otra Etiqueta con ese nombre" });
    }

    await db.query("UPDATE tags SET name = ? WHERE id = ?", [nombre, id]);
    const [update] = await db.query("SELECT * FROM tags WHERE id = ?", [id]);
    res.json(tagDecorator(update[0]));
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

export async function destroy(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const [existing] = await db.query("SELECT * FROM tags WHERE id = ? and user_id = ? ", [id, user_id]);
    const backup = existing
    if (existing.length === 0) {
      return res.status(404).json({ message: "Etiqueta no encontrada" });
    }

    await db.query("DELETE FROM tags WHERE id = ?", [id]);
    res.json(tagDecorator(backup[0]));
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }

}