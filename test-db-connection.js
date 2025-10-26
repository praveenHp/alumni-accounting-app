// Test database connection script
const { Pool } = require('pg');

async function testConnection() {
    console.log('Testing database connection...');
    
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is not set');
        return;
    }
    
    console.log('✅ DATABASE_URL is set');
    console.log('Database URL format:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
    
    try {
        // Parse URL
        const dbUrl = new URL(process.env.DATABASE_URL);
        console.log('📊 Connection details:');
        console.log('  Host:', dbUrl.hostname);
        console.log('  Port:', dbUrl.port || 5432);
        console.log('  Database:', dbUrl.pathname.slice(1));
        console.log('  User:', dbUrl.username);
        
        // Test connection with explicit config
        console.log('\n🔄 Testing explicit configuration...');
        const pool1 = new Pool({
            user: dbUrl.username,
            password: dbUrl.password,
            host: dbUrl.hostname,
            port: dbUrl.port || 5432,
            database: dbUrl.pathname.slice(1),
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        });
        
        const client1 = await pool1.connect();
        console.log('✅ Explicit configuration: SUCCESS');
        client1.release();
        await pool1.end();
        
    } catch (error1) {
        console.log('❌ Explicit configuration failed:', error1.message);
        
        try {
            // Test with connection string
            console.log('\n🔄 Testing connection string method...');
            const pool2 = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            
            const client2 = await pool2.connect();
            console.log('✅ Connection string method: SUCCESS');
            client2.release();
            await pool2.end();
            
        } catch (error2) {
            console.log('❌ Connection string method failed:', error2.message);
            console.log('\n🔍 Debugging info:');
            console.log('Error code:', error2.code);
            console.log('Error errno:', error2.errno);
            console.log('Error address:', error2.address);
            console.log('Error port:', error2.port);
        }
    }
}

// Run the test
testConnection().catch(console.error);
