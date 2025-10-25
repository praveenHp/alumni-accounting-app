const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'alumni_accounting.db');
    }

    // Initialize database connection and create tables
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                    return;
                }
                console.log('Connected to SQLite database');
                this.createTables()
                    .then(() => resolve())
                    .catch(reject);
            });
        });
    }

    // Create tables using schema.sql
    async createTables() {
        return new Promise(async (resolve, reject) => {
            try {
                // First run migrations to handle existing databases
                await this.runMigrations();

                const schemaPath = path.join(__dirname, 'schema.sql');
                const schema = fs.readFileSync(schemaPath, 'utf8');

                this.db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error creating tables:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('Database tables created successfully');
                    resolve();
                });
            } catch (migrationErr) {
                reject(migrationErr);
            }
        });
    }

    // Run database migrations
    async runMigrations() {
        return new Promise((resolve, reject) => {
            // First check if transactions table exists
            this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'", async (err, table) => {
                if (err) {
                    reject(err);
                    return;
                }

                // If table doesn't exist, skip migrations (will be created by schema)
                if (!table) {
                    resolve();
                    return;
                }

                // Check if from_person column exists
                this.db.all("PRAGMA table_info(transactions)", async (err, columns) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const hasFromPersonColumn = columns.some(col => col.name === 'from_person');
                    const hasModeColumn = columns.some(col => col.name === 'mode');

                    try {
                        // Add from_person column if it doesn't exist
                        if (!hasFromPersonColumn) {
                            console.log('Adding from_person column to existing database...');
                            await new Promise((resolveCol, rejectCol) => {
                                this.db.run("ALTER TABLE transactions ADD COLUMN from_person TEXT", (alterErr) => {
                                    if (alterErr) {
                                        console.error('Error adding from_person column:', alterErr.message);
                                        rejectCol(alterErr);
                                        return;
                                    }
                                    console.log('from_person column added successfully');
                                    resolveCol();
                                });
                            });
                        }

                        // Add mode column if it doesn't exist
                        if (!hasModeColumn) {
                            console.log('Adding mode column to existing database...');
                            await new Promise((resolveCol, rejectCol) => {
                                this.db.run("ALTER TABLE transactions ADD COLUMN mode TEXT CHECK (mode IN ('Cash', 'Online'))", (alterErr) => {
                                    if (alterErr) {
                                        console.error('Error adding mode column:', alterErr.message);
                                        rejectCol(alterErr);
                                        return;
                                    }
                                    console.log('mode column added successfully');
                                    resolveCol();
                                });
                            });
                        }

                        // Note: SQLite doesn't support modifying column constraints directly
                        // The description field will accept NULL values by default in new tables
                        // Existing data will remain unchanged

                        resolve();
                    } catch (migrationErr) {
                        reject(migrationErr);
                    }
                });
            });
        });
    }

    // Add a new transaction
    async addTransaction(type, amount, description, category = null, fromPerson = null, mode = null, date = null) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO transactions (type, amount, description, category, from_person, mode, date)
                VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, date('now')))
            `;

            this.db.run(sql, [type, amount, description, category, fromPerson, mode, date], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    // Get all transactions with optional filtering
    async getTransactions(filters = {}) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM transactions WHERE 1=1';
            const params = [];

            // Add filters
            if (filters.type) {
                sql += ' AND type = ?';
                params.push(filters.type);
            }

            if (filters.startDate) {
                sql += ' AND date >= ?';
                params.push(filters.startDate);
            }

            if (filters.endDate) {
                sql += ' AND date <= ?';
                params.push(filters.endDate);
            }

            if (filters.category) {
                sql += ' AND category = ?';
                params.push(filters.category);
            }

            if (filters.fromPerson) {
                sql += ' AND from_person = ?';
                params.push(filters.fromPerson);
            }

            if (filters.mode) {
                sql += ' AND mode = ?';
                params.push(filters.mode);
            }

            sql += ' ORDER BY date DESC, created_at DESC';

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    // Get current balance
    async getCurrentBalance() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    COALESCE(
                        (SELECT SUM(amount) FROM transactions WHERE type = 'credit'), 0
                    ) -
                    COALESCE(
                        (SELECT SUM(amount) FROM transactions WHERE type = 'debit'), 0
                    ) AS balance
            `;

            this.db.get(sql, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row ? parseFloat(row.balance) || 0 : 0);
            });
        });
    }

    // Get transaction by ID
    async getTransactionById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM transactions WHERE id = ?';
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    // Delete a transaction by ID
    async deleteTransaction(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM transactions WHERE id = ?';

            this.db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ changes: this.changes });
            });
        });
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;
