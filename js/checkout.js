// Checkout Logic

document.addEventListener('DOMContentLoaded', () => {
    // Reuse cart array from cart.js (it is global there)
    // Or simpler: re-read from localStorage to be self-contained
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const summaryItemsContainer = document.getElementById('summary-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total');
    const checkoutForm = document.getElementById('checkout-form');

    // Render Order Summary
    renderOrderSummary();

    function renderOrderSummary() {
        if (!summaryItemsContainer) return;

        summaryItemsContainer.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            summaryItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;

                const summaryItem = document.createElement('div');
                summaryItem.classList.add('summary-item');
                summaryItem.innerHTML = `
                    <div class="summary-item-img">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="summary-item-info">
                        <h4>${item.name}</h4>
                        <p class="summary-item-price">$${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <div style="margin-left: auto; font-weight: 500;">
                        $${itemTotal.toFixed(2)}
                    </div>
                `;
                summaryItemsContainer.appendChild(summaryItem);
            });
        }

        // Update Totals
        if (summarySubtotal) summarySubtotal.textContent = '$' + subtotal.toFixed(2);
        if (summaryTotal) summaryTotal.textContent = '$' + subtotal.toFixed(2); // Free shipping
    }

    // Handle Form Submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Basic Validation (HTML5 handles most required fields)
            // Here we would typically send data to a server

            // Simulate Processing
            const btn = document.querySelector('.place-order-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Processing...';
            btn.disabled = true;

            setTimeout(() => {
                // Success!
                // Clear Cart
                localStorage.removeItem('cart');

                // Redirect to Confirmation
                window.location.href = 'order-confirmation.html';
            }, 1500);
        });
    }
});
