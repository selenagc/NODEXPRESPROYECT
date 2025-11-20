export function taskDecorator(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    category_id: task.category_id,
    user_id: task.user_id,
    created_at: task.created_at,
    category: task.category_name ? {
      id: task.category_id,
      name: task.category_name
    } : null,
    tags: task.tags || []
  };
}

export function tasksListDecorator(tasks) {
  return tasks.map(taskDecorator);
}