const { createPool } = require('@vercel/postgres');
require('dotenv').config();

const pool = createPool({
    connectionString: process.env.POSTGRES_URL,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
