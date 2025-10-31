import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'todo_list',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 AS result');
    console.log('Conexión a MySQL exitosa. Resultado de prueba:', rows[0].result);
  } catch (err) {
    console.error('Error al conectar a MySQL:', err);
  }
}

export default pool;
