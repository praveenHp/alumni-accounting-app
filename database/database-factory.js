// Database Factory - Chooses SQLite for local, PostgreSQL for production
const SQLiteDatabase = require('./db');
const PostgreSQLDatabase = require('./postgres-db');

class DatabaseFactory {
    static createDatabase() {
        // Use PostgreSQL if DATABASE_URL is provided (production)
        // Use SQLite for local development
        if (process.env.DATABASE_URL) {
            console.log('Using PostgreSQL database for production');
            return new PostgreSQLDatabase();
        } else {
            console.log('Using SQLite database for local development');
            return new SQLiteDatabase();
        }
    }
}

module.exports = DatabaseFactory;
