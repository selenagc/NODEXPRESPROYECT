export function tagDecorator(tag) {
  return {
    id: tag.id,
    nombre: tag.name,
    user_id: tag.user_id
  };
}