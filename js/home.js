document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.querySelector('.product-grid');

    if (!productGrid) return;

    // Fetch products using the global function from products.js (which we refactored)
    // OR directly here if we want to be independent.
    // Let's use the fetchProducts() from products.js to keep it DRY, assuming products.js is loaded.
    // We need to ensure products.js exposes fetchProducts globally.

    // Check if fetchProducts exists, otherwise define it locally as fallback
    let products = [];
    if (typeof fetchProducts === 'function') {
        products = await fetchProducts();
    } else {
        console.warn('fetchProducts not found, fetching locally');
        try {
            const res = await fetch('/api/products');
            products = await res.json();
        } catch (e) {
            console.error('Failed to fetch products', e);
        }
    }

    // Render Featured Products (First 8)
    const featuredProducts = products.slice(0, 8);

    productGrid.innerHTML = ''; // Clear existing content (loaders or hardcoded)

    featuredProducts.forEach(product => {
        const productCard = document.createElement('article');
        productCard.classList.add('product-card');
        productCard.dataset.id = product.id;
        productCard.dataset.name = product.name;
        productCard.dataset.price = product.price; // Keep basic data attribs if needed by other scripts
        productCard.dataset.image = product.image;

        productCard.innerHTML = `
            <div class="product-image">
                <a href="product.html?id=${product.id}">
                    <div class="image-placeholder">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                </a>
                <button class="add-to-cart-btn"><i class="fa-solid fa-plus"></i> Add</button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <span class="product-price">$${product.price.toFixed(2)}</span>
            </div>
        `;
        productGrid.appendChild(productCard);
    });

    // Re-attach "Add to Cart" listeners
    // We assume cart.js exposes a way to attach listeners or we trigger it
    if (typeof attachEventListeners === 'function') {
        attachEventListeners();
    } else {
        // Fallback: manually attach if cart.js helper isn't global
        // This duplicates logic from cart.js slightly but ensures safety
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find parent card
                const card = e.target.closest('.product-card');
                const id = card.dataset.id;
                const name = card.dataset.name;
                const price = parseFloat(card.dataset.price);
                const image = card.dataset.image;

                if (typeof addToCart === 'function') {
                    addToCart({ id, name, price, image });
                    if (typeof openCart === 'function') openCart();
                }
            });
        });
    }
});
