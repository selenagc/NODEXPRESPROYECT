export function decorateCategory(category) {
  return {
    id: category.id,
    nombre: category.name,
    user_id: category.user_id
  };
}