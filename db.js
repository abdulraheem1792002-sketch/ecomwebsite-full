const { Pool } = require('pg');
require('dotenv').config();

// Remove 'sslmode=require' from URL if present to avoid conflict with our explicit config
const connectionString = process.env.POSTGRES_URL
    ? process.env.POSTGRES_URL.replace(/\?.*$/, '')
    : process.env.POSTGRES_URL;

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false // This bypasses the "self signed cert" error
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
