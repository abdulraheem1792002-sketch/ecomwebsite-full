// Shopping Cart Logic

// State
// State
window.trendstore_cart = JSON.parse(localStorage.getItem('trendstore_cart')) || [];
let cart = window.trendstore_cart;

// DOM Elements
const cartSidebar = document.querySelector('.cart-sidebar');
const cartItemsContainer = document.querySelector('.cart-items');
const cartTotalElement = document.querySelector('.cart-total span:last-child');
const cartCountElements = document.querySelectorAll('.cart-count');
const cartToggle = document.getElementById('cart-toggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    attachEventListeners();
});

function attachEventListeners() {
    // Add to Cart Buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const product = {
                id: card.dataset.id,
                name: card.dataset.name,
                price: parseFloat(card.dataset.price),
                image: card.dataset.image
            };
            addToCart(product);
            openCart();
        });
    });

    // Remove from Cart (Event Delegation)
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item')) {
                const id = e.target.closest('.remove-item').dataset.id;
                removeFromCart(id);
            }
        });
    }
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('trendstore_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update Counts
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(el => el.textContent = totalCount);

    // Update Items in Sidebar
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                // Ensure image path is correct relative to HTML
                // We assume image paths stored are like "../images/foo.jpg"

                cartItem.innerHTML = `
                    <div class="cart-item-img">
                        <img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>$${parseFloat(item.price).toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <button class="remove-item" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
        }
    }

    // Update Total Price
    const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    if (cartTotalElement) {
        cartTotalElement.textContent = '$' + total.toFixed(2);
    }
}

function openCart() {
    if (cartToggle) {
        cartToggle.checked = true;
    }
}

// Styles for dynamic cart item not in original CSS
const style = document.createElement('style');
style.textContent = `
    .cart-item {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f0f0f0;
    }
    .cart-item-img {
        width: 60px;
        height: 60px;
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;
    }
    .cart-item-info {
        flex-grow: 1;
    }
    .cart-item-info h4 {
        font-size: 0.95rem;
        margin-bottom: 5px;
    }
    .cart-item-info p {
        color: #666;
        font-size: 0.9rem;
    }
    .remove-item {
        background: none;
        border: none;
        color: #ff4444;
        cursor: pointer;
        padding: 5px;
    }
`;
document.head.appendChild(style);
