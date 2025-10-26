// PostgreSQL Database Class for Production
const { Pool } = require('pg');

class PostgreSQLDatabase {
    constructor() {
        this.pool = null;
    }

    async initialize() {
        try {
            console.log('Initializing PostgreSQL connection...');

            // Parse the DATABASE_URL to get individual components
            const dbUrl = new URL(process.env.DATABASE_URL);

            // Create connection pool with explicit configuration
            this.pool = new Pool({
                user: dbUrl.username,
                password: dbUrl.password,
                host: dbUrl.hostname,
                port: dbUrl.port || 5432,
                database: dbUrl.pathname.slice(1), // Remove leading slash
                ssl: {
                    rejectUnauthorized: false
                },
                connectionTimeoutMillis: 10000,
                idleTimeoutMillis: 30000,
                max: 10
            });

            // Test the connection
            const client = await this.pool.connect();
            console.log('PostgreSQL connection test successful');
            client.release();

            console.log('Connected to PostgreSQL database');

            // Create tables
            await this.createTables();
            console.log('Database tables created successfully');

            return true;
        } catch (error) {
            console.error('Error initializing PostgreSQL database:', error);
            console.error('Database URL format:', process.env.DATABASE_URL ? 'Present' : 'Missing');

            // Try fallback connection with connection string
            try {
                console.log('Trying fallback connection method...');
                this.pool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: { rejectUnauthorized: false }
                });

                const client = await this.pool.connect();
                console.log('Fallback connection successful');
                client.release();

                await this.createTables();
                console.log('Database tables created successfully');
                return true;
            } catch (fallbackError) {
                console.error('Fallback connection also failed:', fallbackError);
                throw new Error(`Database connection failed: ${error.message}`);
            }
        }
    }

    async createTables() {
        const createTransactionsTable = `
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
                amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
                description TEXT,
                category VARCHAR(100),
                date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                from_person VARCHAR(255),
                mode VARCHAR(20) CHECK (mode IN ('Cash', 'Online'))
            )
        `;

        await this.pool.query(createTransactionsTable);
    }

    async addTransaction(type, amount, description, category, fromPerson, mode, date) {
        const query = `
            INSERT INTO transactions (type, amount, description, category, from_person, mode, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        
        const values = [type, amount, description, category, fromPerson, mode, date];
        const result = await this.pool.query(query, values);
        
        return { id: result.rows[0].id };
    }

    async getTransactions(filters = {}) {
        let query = 'SELECT * FROM transactions WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.type) {
            query += ` AND type = $${paramCount}`;
            values.push(filters.type);
            paramCount++;
        }

        if (filters.category) {
            query += ` AND category = $${paramCount}`;
            values.push(filters.category);
            paramCount++;
        }

        if (filters.fromPerson) {
            query += ` AND from_person = $${paramCount}`;
            values.push(filters.fromPerson);
            paramCount++;
        }

        if (filters.mode) {
            query += ` AND mode = $${paramCount}`;
            values.push(filters.mode);
            paramCount++;
        }

        if (filters.startDate) {
            query += ` AND date >= $${paramCount}`;
            values.push(filters.startDate);
            paramCount++;
        }

        if (filters.endDate) {
            query += ` AND date <= $${paramCount}`;
            values.push(filters.endDate);
            paramCount++;
        }

        query += ' ORDER BY date DESC, created_at DESC';

        const result = await this.pool.query(query, values);
        return result.rows;
    }

    async getTransactionById(id) {
        const query = 'SELECT * FROM transactions WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return result.rows[0];
    }

    async deleteTransaction(id) {
        const query = 'DELETE FROM transactions WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return { changes: result.rowCount };
    }

    async getCurrentBalance() {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
                COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_debits
            FROM transactions
        `;
        
        const result = await this.pool.query(query);
        const row = result.rows[0];
        
        return parseFloat(row.total_credits) - parseFloat(row.total_debits);
    }

    extractHostFromUrl(url) {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            console.error('Error parsing database URL:', error);
            return null;
        }
    }

    close() {
        if (this.pool) {
            this.pool.end();
            console.log('PostgreSQL connection pool closed');
        }
    }
}

module.exports = PostgreSQLDatabase;
