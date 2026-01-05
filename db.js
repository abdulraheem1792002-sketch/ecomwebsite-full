const { Pool } = require('pg');
require('dotenv').config();

// Remove 'sslmode=require' from URL if present to avoid conflict with our explicit config
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('localhost') ? false : {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
