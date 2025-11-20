import { v4 as uuidv4 } from "uuid";
import db from "../db/connection.js";
import { taskDecorator, tasksListDecorator } from "../decorators/task.decorator.js";

export async function store(req, res) {
  try {
    const { title, description, category_id, tag_ids = [] } = req.body;
    const user_id = req.user.id;
    if (!title || !user_id) {
      return res.status(400).json({ message: "Title y user_id son obligatorios" });
    }

    const [userExists] = await db.query("SELECT id FROM user WHERE id = ?", [user_id]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (category_id) {
      const [categoryExists] = await db.query("SELECT id FROM categories WHERE id = ? AND user_id = ?", [category_id, user_id]);
      if (categoryExists.length === 0) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
    }

    if (tag_ids.length > 0) {
      const placeholders = tag_ids.map(() => '?').join(',');
      const [validTags] = await db.query(
        `SELECT id FROM tags WHERE id IN (${placeholders}) AND user_id = ?`,
        [...tag_ids, user_id]
      );

      if (validTags.length !== tag_ids.length) {
        return res.status(404).json({ message: "Alguna etiqueta no existe o no pertenece al usuario" });
      }
    }

    const id = uuidv4();

    await db.query("START TRANSACTION");

    await db.query(
      "INSERT INTO tasks (id, title, description, category_id, user_id) VALUES (?, ?, ?, ?, ?)",
      [id, title, description, category_id, user_id]
    );

    if (tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await db.query(
          "INSERT INTO tags_tasks (tag_id, task_id) VALUES (?, ?)",
          [tagId, id]
        );
      }
    }

    await db.query("COMMIT");

    const [taskRows] = await db.query(
      `SELECT tasks.*, categories.name as category_name
       FROM tasks
       LEFT JOIN categories ON tasks.category_id = categories.id
       WHERE tasks.id = ?`,
      [id]
    );

    const [tagRows] = await db.query(
      `SELECT tags.id, tags.name 
       FROM tags
       JOIN tags_tasks ON tags.id = tags_tasks.tag_id
       WHERE tags_tasks.task_id = ?`,
      [id]
    );

    const taskWithRelations = {
      ...taskRows[0],
      tags: tagRows
    };

    res.status(201).json({
      data: taskDecorator(taskWithRelations)
    });

  } catch (error) {
    await db.query("ROLLBACK");
    res.status(500).json({
      message: "Error interno del servidor store task",
      error: error.message
    });
  }
}

export async function index(req, res) {
  try {
    const { category_id, status, tag_id } = req.query;
    const user_id = req.user.id;
    let query = `
      SELECT tasks.*, categories.name as category_name
      FROM tasks
      LEFT JOIN categories ON tasks.category_id = categories.id
      WHERE tasks.user_id = ?
    `;

    const params = [user_id];

    if (category_id) {
      query += " AND tasks.category_id = ?";
      params.push(category_id);
    }

    if (status) {
      query += " AND tasks.status = ?";
      params.push(status);
    }

    if (tag_id) {
      query += " AND tasks.id IN (SELECT task_id FROM tags_tasks WHERE tag_id = ?)";
      params.push(tag_id);
    }

    query += " ORDER BY tasks.created_at DESC";

    const [tasks] = await db.query(query, params);

    const taskIds = tasks.map(task => task.id);

    let tasksWithTags = [];

    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      const [allTagRows] = await db.query(
        `SELECT tags.id, tags.name, tags_tasks.task_id
         FROM tags
         JOIN tags_tasks ON tags.id = tags_tasks.tag_id
         WHERE tags_tasks.task_id IN (${placeholders})`,
        taskIds
      );

      const tagsByTaskId = {};
      allTagRows.forEach(tag => {
        if (!tagsByTaskId[tag.task_id]) {
          tagsByTaskId[tag.task_id] = [];
        }
        tagsByTaskId[tag.task_id].push({
          id: tag.id,
          name: tag.name
        });
      });

      tasksWithTags = tasks.map(task => ({
        ...task,
        tags: tagsByTaskId[task.id] || []
      }));
    }

    res.json(tasksListDecorator(tasksWithTags));

  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

export async function show(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const [taskRows] = await db.query(
      `SELECT tasks.*, categories.name as category_name
       FROM tasks
       LEFT JOIN categories ON tasks.category_id = categories.id
       WHERE tasks.id = ? AND tasks.user_id = ?`,
      [id, user_id]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    const taskIds = [id];
    const placeholders = taskIds.map(() => '?').join(',');

    const [tagRows] = await db.query(
      `SELECT tags.id, tags.name 
       FROM tags
       JOIN tags_tasks ON tags.id = tags_tasks.tag_id
       WHERE tags_tasks.task_id IN (${placeholders})`,
      taskIds
    );

    const taskWithRelations = {
      ...taskRows[0],
      tags: tagRows
    };

    res.json({
      data: taskDecorator(taskWithRelations)
    });


  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { title, description, status, category_id, tag_ids } = req.body;
    const user_id = req.user.id;
    const [existingTask] = await db.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (existingTask.length === 0) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    if (category_id) {
      const [categoryExists] = await db.query(
        "SELECT id FROM categories WHERE id = ? AND user_id = ?",
        [category_id, user_id]
      );
      if (categoryExists.length === 0) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
    }

    if (tag_ids !== undefined && tag_ids.length > 0) {
      const placeholders = tag_ids.map(() => '?').join(',');
      const [validTags] = await db.query(
        `SELECT id FROM tags WHERE id IN (${placeholders}) AND user_id = ?`,
        [...tag_ids, user_id]
      );

      if (validTags.length !== tag_ids.length) {
        return res.status(404).json({ message: "Alguna etiqueta no existe o no pertenece al usuario" });
      }
    }

    await db.query("START TRANSACTION");

    const updateFields = [];
    const updateParams = [];

    if (title !== undefined) {
      updateFields.push("title = ?");
      updateParams.push(title);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      updateParams.push(description);
    }
    if (status !== undefined) {
      updateFields.push("status = ?");
      updateParams.push(status);
    }
    if (category_id !== undefined) {
      updateFields.push("category_id = ?");
      updateParams.push(category_id);
    }

    if (updateFields.length > 0) {
      updateParams.push(id, user_id);
      await db.query(
        `UPDATE tasks SET ${updateFields.join(", ")} WHERE id = ? AND user_id = ?`,
        updateParams
      );
    }

    if (tag_ids !== undefined) {
      await db.query("DELETE FROM tags_tasks WHERE task_id = ?", [id]);

      if (tag_ids.length > 0) {
        for (const tagId of tag_ids) {
          await db.query(
            "INSERT INTO tags_tasks (tag_id, task_id) VALUES (?, ?)",
            [tagId, id]
          );
        }
      }
    }

    await db.query("COMMIT");
    const [taskRows] = await db.query(
      `SELECT tasks.*, categories.name as category_name
       FROM tasks
       LEFT JOIN categories ON tasks.category_id = categories.id
       WHERE tasks.id = ?`,
      [id]
    );

    const taskIds = [id];
    const placeholders = taskIds.map(() => '?').join(',');

    const [tagRows] = await db.query(
      `SELECT tags.id, tags.name 
       FROM tags
       JOIN tags_tasks ON tags.id = tags_tasks.tag_id
       WHERE tags_tasks.task_id IN (${placeholders})`,
      taskIds
    );

    const taskWithRelations = {
      ...taskRows[0],
      tags: tagRows
    };

    res.json({
      message: "Tarea actualizada correctamente",
      data: taskDecorator(taskWithRelations)
    });

  } catch (error) {
    await db.query("ROLLBACK");
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

export async function destroy(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const [existingTask] = await db.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (existingTask.length === 0) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    await db.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);

    res.json({
      message: "Tarea eliminada correctamente",
      deleted: true
    });

  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
}