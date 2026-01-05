require('dotenv').config();
const { createPool } = require('@vercel/postgres');

const pool = createPool({
    connectionString: process.env.POSTGRES_URL,
});

const products = [
    {
        "id": "1",
        "name": "Classic Leather Jacket",
        "price": 120,
        "image": "../images/product-1.jpg",
        "category": "Outerwear",
        "description": "A timeless classic. This premium leather jacket features a tailored fit, durable hardware, and a comfortable lining. Perfect for any season."
    },
    {
        "id": "2",
        "name": "Denim Jeans",
        "price": 45,
        "image": "../images/product-2.jpg",
        "category": "Bottoms",
        "description": "Comfortable and stylish denim jeans with a modern slim fit. Made from high-quality cotton blend for durability and stretch."
    },
    {
        "id": "3",
        "name": "Cotton T-Shirt",
        "price": 25,
        "image": "../images/product-3.jpg",
        "category": "Tops",
        "description": "Essential cotton t-shirt for your everyday wardrobe. Soft, breathable fabric ensures all-day comfort. Available in multiple colors."
    },
    {
        "id": "4",
        "name": "Running Sneakers",
        "price": 89,
        "image": "../images/product-4.jpg",
        "category": "Footwear",
        "description": "Performance running sneakers designed for speed and comfort. Features a cushioned sole and breathable mesh upper."
    },
    {
        "id": "5",
        "name": "Smart Watch",
        "price": 199,
        "image": "../images/smart_watch.png",
        "category": "Accessories",
        "description": "Stay connected and track your fitness with this advanced smart watch. Features heart rate monitoring, GPS, and long battery life."
    },
    {
        "id": "6",
        "name": "Premium Yoga Mat",
        "price": 35,
        "image": "../images/yoga_mat.png",
        "category": "Accessories",
        "description": "Non-slip premium yoga mat for your daily practice. Eco-friendly material provides excellent cushioning and support."
    },
    {
        "id": "7",
        "name": "Aviator Sunglasses",
        "price": 150,
        "image": "../images/aviator_sunglasses_product.png",
        "category": "Accessories",
        "description": "Classic aviator sunglasses with UV protection. Stylish metal frame and polarized lenses for ultimate eye protection."
    },
    {
        "id": "8",
        "name": "Urban Backpack",
        "price": 75,
        "image": "../images/backpack.png",
        "category": "Bags",
        "description": "Durable urban backpack with laptop compartment. Ergonomic design and multiple pockets populate for organized storage."
    },
    {
        "id": "9",
        "name": "Summer Cotton Dress",
        "price": 55,
        "image": "../images/product-3.jpg",
        "category": "Dresses",
        "description": "Light and airy cotton dress perfect for summer days. Features a flattering silhouette and comfortable fit."
    },
    {
        "id": "10",
        "name": "High Waist Jeans",
        "price": 48,
        "image": "../images/product-2.jpg",
        "category": "Bottoms",
        "description": "Trendy high-waist jeans that accentuate your figure. versatile style that pairs well with crop tops or tucked-in shirts."
    },
    {
        "id": "1767269733648",
        "name": "Exotic Parrot",
        "price": 100,
        "image": "../images/parrot_product_photo.png",
        "category": "Pets",
        "description": "A beautiful, vibrant parrot looking for a new home. Intelligent and friendly companion."
    }
];

const posts = [
    {
        "id": "1",
        "title": "Summer Fashion Trends 2026",
        "date": "2026-05-15",
        "category": "Fashion",
        "image": "../images/blog-1.jpg",
        "excerpt": "Discover the hottest styles for the upcoming season. From bold colors to lightweight fabrics, here is what you need to know.",
        "content": "Summer is all about comfort and style. This year, we are seeing a resurgence of retro prints and sustainable fabrics. ... (Full article content)"
    },
    {
        "id": "2",
        "title": "Sustainable Shopping Guide",
        "date": "2026-05-10",
        "category": "Lifestyle",
        "image": "../images/blog-2.jpg",
        "excerpt": "How to build an eco-friendly wardrobe without breaking the bank. Tips for choosing durable and ethical clothing.",
        "content": "Sustainability is more than just a buzzword. It is a lifestyle choice that impacts our planet. Here are 5 tips to shop smarter... (Full article content)"
    },
    {
        "id": "3",
        "title": "The Perfect Accessories",
        "date": "2026-05-02",
        "category": "Style",
        "image": "../images/blog-3.jpg",
        "excerpt": "Elevate your outfit with the right accessories. A guide to matching jewelry, bags, and shoes.",
        "content": "Accessories can make or break an outfit. Whether you prefer minimalist gold chains or chunky statement pieces... (Full article content)"
    }
];

async function seed() {
    try {
        console.log('Using connection string:', process.env.POSTGRES_URL ? 'FOUND' : 'MISSING');

        // --- 1. Create Tables ---
        console.log('Creating tables...');

        // Users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Orders
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                status TEXT NOT NULL,
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data JSONB
            )
        `);

        // Products
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price NUMERIC NOT NULL,
                image TEXT,
                category TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Posts
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                date DATE,
                category TEXT,
                image TEXT,
                excerpt TEXT,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Messages (Contact Form)
        await pool.query(`
             CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tables created.');

        // --- 2. Seed Data ---
        console.log('Seeding products...');
        let productCount = 0;
        for (const p of products) {
            const check = await pool.query('SELECT id FROM products WHERE id = $1', [p.id]);
            if (check.rowCount === 0) {
                await pool.query(
                    'INSERT INTO products (id, name, price, image, category, description) VALUES ($1, $2, $3, $4, $5, $6)',
                    [p.id, p.name, p.price, p.image, p.category, p.description]
                );
                productCount++;
            }
        }
        console.log(`Added ${productCount} products.`);

        console.log('Seeding blog posts...');
        let postCount = 0;
        for (const p of posts) {
            const check = await pool.query('SELECT id FROM posts WHERE id = $1', [p.id]);
            if (check.rowCount === 0) {
                await pool.query(
                    'INSERT INTO posts (id, title, date, category, image, excerpt, content) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [p.id, p.title, p.date, p.category, p.image, p.excerpt, p.content]
                );
                postCount++;
            }
        }
        console.log(`Added ${postCount} posts.`);

        const finalProducts = await pool.query('SELECT count(*) FROM products');
        const finalPosts = await pool.query('SELECT count(*) FROM posts');
        console.log(`FINAL COUNTS: Products=${finalProducts.rows[0].count}, Posts=${finalPosts.rows[0].count}`);

        console.log('Seeding complete successfully!');
        process.exit(0);

    } catch (err) {
        console.error('Seeding Failed:', err);
        process.exit(1);
    }
}

seed();
