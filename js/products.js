// Fetch products from API
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// For backward compatibility if any script still expects 'products' array synchronously:
// We can't easily provide synchronous data from async fetch.
// Scripts must be updated to use fetchProducts().

