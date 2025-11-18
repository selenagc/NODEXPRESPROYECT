import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = (req, res, next) =>{
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Token de autorización requerido'  });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Formato de token inválido. Use: Bearer <token>' });
        }

        const decoded = verifyToken(token);

        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({ message: 'Token Invalido', error: err.message });
    }
};