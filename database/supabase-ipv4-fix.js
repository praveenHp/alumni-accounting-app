// Supabase IPv4 connection workaround
const { Pool } = require('pg');
const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

class SupabaseIPv4Database {
    constructor() {
        this.pool = null;
    }

    async resolveIPv4(hostname) {
        try {
            const addresses = await resolve4(hostname);
            console.log(`Resolved ${hostname} to IPv4:`, addresses[0]);
            return addresses[0];
        } catch (error) {
            console.error('IPv4 resolution failed:', error.message);
            throw error;
        }
    }

    async initialize() {
        try {
            console.log('Attempting Supabase IPv4 connection...');
            
            const dbUrl = new URL(process.env.DATABASE_URL);
            console.log('Original hostname:', dbUrl.hostname);
            
            // Try to resolve to IPv4
            const ipv4Address = await this.resolveIPv4(dbUrl.hostname);
            
            // Create connection with IPv4 address
            this.pool = new Pool({
                user: dbUrl.username,
                password: dbUrl.password,
                host: ipv4Address, // Use IPv4 address instead of hostname
                port: dbUrl.port || 5432,
                database: dbUrl.pathname.slice(1),
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 10000
            });

            // Test connection
            const client = await this.pool.connect();
            console.log('✅ IPv4 connection successful!');
            client.release();

            return true;
        } catch (error) {
            console.error('IPv4 connection failed:', error.message);
            throw error;
        }
    }

    // Add all other methods from postgres-db.js here...
    async createTables() {
        // Same as postgres-db.js
    }

    // ... other methods
}

module.exports = SupabaseIPv4Database;
