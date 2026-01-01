document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const resultsContainer = document.getElementById('search-results-grid');
    const searchHeader = document.getElementById('search-header-text');

    if (!query) {
        if (searchHeader) searchHeader.textContent = 'Please enter a search term.';
        return;
    }

    if (searchHeader) searchHeader.textContent = `Search Results for "${query}"`;

    // Ensure products are loaded
    await fetchProducts();

    // Perform Search (Case insensitive, checking name and category)
    const lowerQuery = query.toLowerCase();
    const results = products.filter(product => {
        return product.name.toLowerCase().includes(lowerQuery) ||
            product.category.toLowerCase().includes(lowerQuery) ||
            product.description.toLowerCase().includes(lowerQuery);
    });

    // Render Results
    if (resultsContainer) {
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                    <i class="fa-regular fa-face-frown" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-light);"></i>
                    <p>No products found matching your search.</p>
                </div>`;
            return;
        }

        results.forEach(product => {
            const productCard = document.createElement('article');
            productCard.classList.add('product-card');
            productCard.dataset.id = product.id;
            productCard.dataset.name = product.name;
            productCard.dataset.price = product.price;
            productCard.dataset.image = product.image;

            productCard.innerHTML = `
               <div class="product-image">
                    <div class="image-placeholder">
                        <a href="product.html?id=${product.id}">
                            <img src="${product.image}" alt="${product.name}">
                        </a>
                    </div>
                    <button class="add-to-cart-btn"><i class="fa-solid fa-plus"></i> Add</button>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                </div>
            `;
            resultsContainer.appendChild(productCard);
        });

        // Re-attach existing event listeners (Add to Cart)
        // Since we are creating dynamic elements, we can relying on delegation or re-run existing scripts logic.
        // cart.js attaches listeners on load. For dynamic content, we either need to re-call it or use delegation.
        // cart.js uses efficient delegation? Checking cart.js... 
        // cart.js: attachEventListeners() selects .add-to-cart-btn.
        // So we need to call it again.

        if (typeof attachEventListeners === 'function') {
            attachEventListeners();
        }
    }
});
