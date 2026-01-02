document.addEventListener('DOMContentLoaded', () => {
    // Security Check
    const user = JSON.parse(localStorage.getItem('trendstore_user'));
    if (!user || user.role !== 'admin') {
        alert('Access Denied: You must be an admin to view this page.');
        window.location.href = 'index.html';
        return;
    }
    loadOrders();
    loadProducts(); // Load products as well

    // Product Form Listener
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSave);
    }
});

// --- TABS LOGIC ---
function switchTab(tab) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Views
    document.querySelectorAll('.admin-view').forEach(view => view.style.display = 'none');
    document.getElementById(`view-${tab}`).style.display = 'block';
}




// Keep Global Orders to access in Modal
let currentOrders = [];

async function loadOrders() {
    const tableBody = document.querySelector('#orders-table tbody');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';

    try {
        const response = await fetch('/api/orders');

        if (!response.ok) {
            throw new Error(`Server returned ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        try {
            currentOrders = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            throw new Error('Invalid JSON response from server');
        }

        // 1. Calculate Stats
        calculateStats(currentOrders);

        // 2. Render Table
        tableBody.innerHTML = '';

        if (currentOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found.</td></tr>';
            return;
        }

        currentOrders.forEach(order => {
            const row = document.createElement('tr');

            const date = new Date(order.date).toLocaleDateString() + ' ' + new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Status Dropdown
            const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
            let statusOptions = '';
            statuses.forEach(s => {
                const selected = (s === order.status) ? 'selected' : '';
                statusOptions += `<option value="${s}" ${selected}>${s}</option>`;
            });

            const statusSelect = `
                <select class="status-select" onchange="updateStatus('${order.id}', this.value)" style="color: ${getStatusColor(order.status)}">
                    ${statusOptions}
                </select>
            `;

            const email = order.shippingDetails ? order.shippingDetails.email : 'N/A';
            const customerName = order.customerName || (order.recipient ? order.recipient.name : 'Guest');

            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${date}</td>
                <td>
                    <strong>${customerName}</strong><br>
                    <small>${email}</small>
                </td>
                <td>${statusSelect}</td>
                <td>$${parseFloat(order.total).toFixed(2)}</td>
                <td>
                    <button class="btn btn-secondary btn-view" onclick="viewOrder('${order.id}')">View</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading orders:', error);
        tableBody.innerHTML = `< tr > <td colspan="6" style="text-align: center; color: red;">Error: ${error.message}</td></tr > `;
    }
}

function calculateStats(orders) {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const avgOrder = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-revenue').textContent = '$' + totalRevenue.toFixed(2);
    document.getElementById('avg-order').textContent = '$' + avgOrder.toFixed(2);
}

function getStatusColor(status) {
    switch (status && status.toLowerCase()) {
        case 'pending': return '#d97706'; // amber
        case 'processing': return '#2563eb'; // blue
        case 'shipped': return '#4f46e5'; // indigo
        case 'delivered': return '#16a34a'; // green
        case 'cancelled': return '#dc2626'; // red
        default: return '#333';
    }
}

async function updateStatus(orderId, newStatus) {
    // Optimistic UI update or simple alert
    try {
        const res = await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            // Success
            // Reload to refresh lists and colors
            loadOrders();
        } else {
            alert('Failed to update status');
        }
    } catch (e) {
        console.error(e);
        alert('Error updating status');
    }
}

function viewOrder(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    // Populate Modal
    document.getElementById('modal-order-id').textContent = '(ID: ' + order.id + ')';
    document.getElementById('modal-customer').innerHTML = `
                < strong > Name:</strong > ${order.customerName} <br>
                    <strong>Email:</strong> ${order.shippingDetails.email}
                    `;

    // Address (handle optional fields if any)
    const ship = order.shippingDetails;
    document.getElementById('modal-address').innerHTML = `
                    <strong>Shipping Address:</strong><br>
                        ${ship.address}, ${ship.city}, ${ship.zip}
                        `;

    // Items
    const itemsContainer = document.getElementById('modal-items');
    itemsContainer.innerHTML = '';
    order.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `
                        <span>${item.quantity}x ${item.name}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        `;
        itemsContainer.appendChild(div);
    });

    document.getElementById('modal-total').textContent = '$' + parseFloat(order.total).toFixed(2);

    // Show Modal
    document.querySelector('.modal-overlay').classList.add('active');
}

function closeModal(modalId) {
    // Support generic close or specific
    const id = modalId || 'order-modal';
    document.getElementById(id).classList.remove('active');
}


// --- TABS ---
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    document.querySelectorAll('.admin-view').forEach(view => view.style.display = 'none');
    document.getElementById(`view-${tab}`).style.display = 'block';
}

// --- PRODUCT MANAGEMENT ---
let currentProducts = [];

async function loadProducts() {
    const tableBody = document.getElementById('products-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading...</td></tr>';

    try {
        const res = await fetch('/api/products');
        currentProducts = await res.json();

        tableBody.innerHTML = '';
        currentProducts.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${p.image}" alt="${p.name}" style="width: 50px; hieght: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td>
                    <div class="action-btn-group">
                        <button class="btn btn-edit btn-sm" onclick="openProductModal('${p.id}')">Edit</button>
                        <button class="btn btn-delete btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error(err);
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: ${err.message || 'Unknown error'}</td></tr>`;
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    // Reset Form
    form.reset();
    document.getElementById('edit-product-id').value = '';

    if (productId) {
        // Edit Mode
        const product = currentProducts.find(p => p.id === productId);
        if (product) {
            title.textContent = 'Edit Product';
            document.getElementById('edit-product-id').value = product.id;
            document.getElementById('p-name').value = product.name;
            document.getElementById('p-price').value = product.price;
            document.getElementById('p-category').value = product.category;
            document.getElementById('p-image').value = product.image;
            document.getElementById('p-description').value = product.description;
        }
    } else {
        // Add Mode
        title.textContent = 'Add New Product';
    }

    modal.classList.add('active');
}

async function handleProductSave(e) {
    e.preventDefault();

    const id = document.getElementById('edit-product-id').value;
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const category = document.getElementById('p-category').value;
    const image = document.getElementById('p-image').value;
    const description = document.getElementById('p-description').value;

    const payload = { name, price, category, image, description };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal('product-modal');
            loadProducts(); // Refresh list
            alert(id ? 'Product updated!' : 'Product created!');
        } else {
            alert('Failed to save product.');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving product.');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            loadProducts();
        } else {
            alert('Failed to delete product.');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting product.');
    }
}
