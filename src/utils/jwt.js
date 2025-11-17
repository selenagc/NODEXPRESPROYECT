import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-secreta-super-segura-2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email 
    }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES } 
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido');
  }
};