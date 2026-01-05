const { Pool } = require('pg');
require('dotenv').config();

// Remove 'sslmode=require' from URL if present to avoid conflict with our explicit config
// Handle connection string - strip sslmode to avoid conflicts with explicit config
let connectionString = process.env.POSTGRES_URL;
if (connectionString && connectionString.includes('?')) {
    connectionString = connectionString.split('?')[0];
}

const pool = new Pool({
    connectionString,
    ssl: connectionString && connectionString.includes('localhost') ? false : {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
