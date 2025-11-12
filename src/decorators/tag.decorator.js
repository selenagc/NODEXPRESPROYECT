export function tagDecorator(tag) {
  return {
    id: tag.id,
    name: tag.name,
    user_id: tag.user_id
  };
}