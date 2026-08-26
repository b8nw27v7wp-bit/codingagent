import "server-only";
import mysql from "mysql2/promise";

// 数据库连接池（本地开发默认值；生产通过环境变量覆盖）
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Wy041022",
  database: process.env.DB_NAME || "ai_tutor",
  waitForConnections: true,
  connectionLimit: 5,
  charset: "utf8mb4",
});

/** 初始化数据表（幂等） */
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id INT NOT NULL,
      course_id VARCHAR(100) NOT NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, course_id),
      CONSTRAINT fk_progress_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export interface DbUser {
  id: number;
  email: string;
  password_hash: string;
}

/** 按邮箱查用户 */
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return (rows[0] as DbUser) || null;
}

/** 创建用户；邮箱已存在返回 null */
export async function createUser(
  email: string,
  passwordHash: string
): Promise<DbUser | null> {
  try {
    const [result] = await pool.query<mysql.ResultSetHeader>(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, passwordHash]
    );
    return { id: result.insertId, email, password_hash: passwordHash };
  } catch (err: unknown) {
    // 唯一键冲突（ER_DUP_ENTRY = 1062）
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") return null;
    throw err;
  }
}

/** 读取某用户的全部学习进度 */
export async function loadUserProgress(
  userId: number
): Promise<Record<string, unknown>> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT course_id, data FROM user_progress WHERE user_id = ?",
    [userId]
  );
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[String(row.course_id)] = row.data;
  }
  return result;
}

/** 整体保存某用户的学习进度（按课程 upsert） */
export async function saveUserProgress(
  userId: number,
  progress: Record<string, unknown>
) {
  for (const [courseId, data] of Object.entries(progress)) {
    await pool.query(
      `INSERT INTO user_progress (user_id, course_id, data)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data)`,
      [userId, courseId, JSON.stringify(data)]
    );
  }
}

/**
 * 健康检查用数据库连通性探测：执行 SELECT 1，带超时兜底。
 * 只返回布尔结果，不向外泄露任何连接细节；异常一律视为不可用。
 */
export async function checkDbConnection(timeoutMs = 2000): Promise<boolean> {
  try {
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("健康检查超时")), timeoutMs)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

export default pool;
