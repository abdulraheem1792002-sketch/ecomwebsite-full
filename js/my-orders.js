document.addEventListener('DOMContentLoaded', loadMyOrders);

async function loadMyOrders() {
    const user = JSON.parse(localStorage.getItem('trendstore_user'));

    if (!user) {
        window.location.href = 'signin.html';
        return;
    }

    const tableBody = document.querySelector('#my-orders-table tbody');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading...</td></tr>';

    try {
        // Fetch only MY orders
        const response = await fetch(`/api/orders?userId=${user.id}`);
        const orders = await response.json();

        tableBody.innerHTML = '';

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">You have placed no orders yet.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');

            const date = new Date(order.date).toLocaleDateString();
            const statusClass = 'status-' + order.status.toLowerCase();
            const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${date}</td>
                <td>
                    <span style="display:block; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${itemsSummary}
                    </span>
                </td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>$${parseFloat(order.total).toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading orders:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading orders.</td></tr>';
    }
    // --- Inits ---
    loadProfile();

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

// --- TABS ---
function switchAccountTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    document.querySelectorAll('.account-view').forEach(view => view.style.display = 'none');
    document.getElementById(`view-${tab}`).style.display = 'block';
}

// --- PROFILE LOGIC ---
function loadProfile() {
    const user = JSON.parse(localStorage.getItem('trendstore_user'));
    if (user) {
        document.getElementById('p-name').value = user.name || '';
        document.getElementById('p-email').value = user.email || '';
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('trendstore_user'));
    const name = document.getElementById('p-name').value;
    const email = document.getElementById('p-email').value;
    const password = document.getElementById('p-password').value;

    const payload = {
        id: user.id,
        name,
        email,
        password: password ? password : undefined
    };

    try {
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            // Update LocalStorage
            localStorage.setItem('trendstore_user', JSON.stringify(data.user));

            // Allow time for user to see success
            alert('Profile updated successfully!');

            // Clear password field
            document.getElementById('p-password').value = '';

            // If name changed in header? It might need a reload or a direct DOM update, 
            // but reload is safer to propagate changes everywhere.
            // window.location.reload(); 
        } else {
            alert(data.message || 'Update failed.');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred. Please try again.');
    }
}
