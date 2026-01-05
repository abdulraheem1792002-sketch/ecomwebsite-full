document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const container = document.getElementById('product-container');

    if (!productId) {
        container.innerHTML = '<p>Product not specified.</p>';
        return;
    }

    // Ensure products are loaded
    const products = await fetchProducts();

    // Look up product in the loaded array
    const product = products.find(p => p.id === productId);

    if (!product) {
        container.innerHTML = '<p>Product not found.</p>';
        return;
    }

    // Render Product Details
    container.innerHTML = `
        <div class="details-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="details-info">
            <span class="details-category">${product.category}</span>
            <h1>${product.name}</h1>
            <span class="details-price">$${parseFloat(product.price).toFixed(2)}</span>
            <p class="details-description">${product.description}</p>
            
            <div class="details-actions">
                <button class="details-add-btn add-to-cart-dummy">
                    Add to Cart
                </button>
            </div>
        </div>
    `;

    // Attach Add to Cart Listener manually since this button is dynamically added
    // We reuse the logic from cart.js but specifically for this button structure
    const btn = container.querySelector('.add-to-cart-dummy');
    btn.addEventListener('click', () => {
        // cart.js should be loaded, so addToCart function is available
        // We construct the product object manually
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        });

        // Open cart sidebar (function from cart.js)
        if (typeof openCart === 'function') {
            openCart();
        }
    });
});
