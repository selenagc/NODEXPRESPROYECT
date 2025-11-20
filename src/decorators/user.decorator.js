export function userDecorator(user) {
  return {
    id: user.id || null,
    name: user.name,
    email: user.email,
  };
}