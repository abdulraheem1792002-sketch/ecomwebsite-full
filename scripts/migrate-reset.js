require('dotenv').config();
const { createPool } = require('@vercel/postgres');

const pool = createPool({
    connectionString: process.env.POSTGRES_URL,
});

async function migrate() {
    try {
        console.log('Migrating database for password reset...');

        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_token TEXT,
            ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP;
        `);

        console.log('Migration successful: Added reset_token and reset_expires columns.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
