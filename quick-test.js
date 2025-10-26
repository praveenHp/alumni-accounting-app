// Quick Supabase connection test
const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres:your_password@db.njkyrhgfargsjbajgyxf.supabase.co:5432/postgres";

async function quickTest() {
    console.log('🔄 Testing Supabase connection...');
    
    try {
        const pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        const client = await pool.connect();
        console.log('✅ Connection successful!');
        
        // Test a simple query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Query successful!');
        console.log('📅 Current time:', result.rows[0].current_time);
        
        client.release();
        await pool.end();
        
        console.log('🎉 Supabase connection is working perfectly!');
        
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        console.log('🔍 Error details:', error.code);
    }
}

quickTest();
