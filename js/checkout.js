// Checkout Logic

document.addEventListener('DOMContentLoaded', () => {
    // Reuse cart array from cart.js (it is global there)
    // Or simpler: re-read from localStorage to be self-contained
    // Reuse cart array from cart.js (it is global there)
    // Use the shared global variable to ensure Sidebar and Summary always match
    let cart = window.trendstore_cart || JSON.parse(localStorage.getItem('trendstore_cart')) || [];

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
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.querySelector('.place-order-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Processing...';
            btn.disabled = true;

            // 1. Gather Form Data
            const formData = new FormData(checkoutForm);
            const shippingDetails = Object.fromEntries(formData.entries());

            // 2. Gather Cart Data (Re-read to be safe)
            const currentCart = window.trendstore_cart || JSON.parse(localStorage.getItem('trendstore_cart')) || [];
            if (currentCart.length === 0) {
                alert('Your cart is empty!');
                btn.textContent = originalText;
                btn.disabled = false;
                return;
            }

            const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // 3. User Data (if logged in)
            const user = JSON.parse(localStorage.getItem('trendstore_user')) || null;
            const userId = user ? user.id : 'guest';

            // 4. Construct Order Object
            const orderPayload = {
                userId: userId,
                customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`, // Combine names
                items: currentCart,
                total: total,
                shippingDetails: shippingDetails
            };

            try {
                // 5. Send to API
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderPayload)
                });

                const result = await response.json();

                if (response.ok) {
                    // 6. Success: Clear Cart & Redirect
                    localStorage.removeItem('trendstore_cart');
                    window.location.href = 'order-confirmation.html?orderId=' + result.orderId;
                } else {
                    alert('Order Failed: ' + result.message);

                    // If session invalid (401), force logout cleanup
                    if (response.status === 401) {
                        localStorage.removeItem('trendstore_user');
                        localStorage.removeItem('token');
                        window.location.href = 'signin.html';
                        return;
                    }

                    btn.textContent = originalText;
                    btn.disabled = false;
                }

            } catch (error) {
                console.error('Error placing order:', error);
                alert('Something went wrong. Please try again.');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});
