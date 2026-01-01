require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function initDb() {
  try {
    console.log('Initializing database...');

    // Create Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Verified "users" table.');

    // Create Orders Table
    // stored as JSONB to mimic the flexibility of the previous JSON file storage
    // but extracting critical fields for querying
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        status TEXT NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB
      );
    `;
    console.log('Verified "orders" table.');

    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDb();
