const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'chatapp.db');
const db = new Database(dbPath);

// Performance & safety
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

console.log('✅ SQLite database connected:', dbPath);

// Wrapper to match mysql2-style API so routes need minimal changes
// Usage: const [rows] = await pool.execute(sql, params)
const pool = {
  async execute(sql, params = []) {
    const trimmed = sql.trim().toUpperCase();
    const isSelect = trimmed.startsWith('SELECT');

    try {
      const stmt = db.prepare(sql);

      if (isSelect) {
        const rows = stmt.all(...params);
        return [rows];
      } else {
        const result = stmt.run(...params);
        return [{ insertId: Number(result.lastInsertRowid), affectedRows: result.changes }];
      }
    } catch (err) {
      // Rethrow with the same error codes routes check for
      if (err.message.includes('UNIQUE constraint failed')) {
        err.code = 'ER_DUP_ENTRY';
      }
      throw err;
    }
  },

  // For schema init — runs raw SQL without prepare
  async getConnection() {
    return {
      query(sql) {
        db.exec(sql);
      },
      release() {
        // No-op for SQLite
      }
    };
  },

  // Direct access to the underlying db for advanced use
  db
};

module.exports = pool;
