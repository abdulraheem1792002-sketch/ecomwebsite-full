document.addEventListener('DOMContentLoaded', () => {

    // --- Session Management (Run on all pages) ---
    checkSession();

    // --- Logout Logic (Global) ---
    // Since logout button might be dynamically added by checkSession, we use delegation or attach after render.
    // Easier: attach to document and check target.
    document.addEventListener('click', (e) => {
        if (e.target.closest('#logout-btn')) {
            e.preventDefault();
            logout();
        }
    });

    // --- Signup Form Handling ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            // Confirm password check if field exists, but let's keep it simple for now

            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('Account created! Please sign in.');
                    window.location.href = 'signin.html';
                } else {
                    alert(data.message + (data.error ? '\nError: ' + data.error : ''));
                }
            } catch (err) {
                console.error(err);
                alert('Something went wrong.');
            }
        });
    }

    // --- Login Form Handling ---
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    // Check if there's a "Remember me" checkbox (optional)
                    // Save to localStorage
                    localStorage.setItem('trendstore_user', JSON.stringify(data.user));

                    alert('Welcome back, ' + data.user.name + '!');
                    window.location.href = 'index.html';
                } else {
                    alert(data.message + (data.error ? '\nError: ' + data.error : ''));
                }
            } catch (err) {
                console.error(err);
                alert('Connection error.');
            }
        });
    }
});

function checkSession() {
    const userStr = localStorage.getItem('trendstore_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        updateHeaderLoggedIn(user);
    }
}

function updateHeaderLoggedIn(user) {
    // 1. Desktop Icon Handling (User Profile)
    const userBtn = document.querySelector('.user-btn');
    if (userBtn) {
        // ALWAYS link to My Orders (or Profile in future) for the User Icon
        userBtn.href = 'my-orders.html';
        userBtn.innerHTML = '<i class="fa-solid fa-user-check"></i>';
        userBtn.title = `Hi, ${user.name}`;
    }

    // 2. Admin Dashboard Icon (New)
    const headerIcons = document.querySelector('.header-icons');
    if (headerIcons && user.role === 'admin' && !document.getElementById('admin-dashboard-btn')) {
        const adminBtn = document.createElement('a');
        adminBtn.href = 'admin.html';
        adminBtn.className = 'icon-btn';
        adminBtn.id = 'admin-dashboard-btn';
        adminBtn.innerHTML = '<i class="fa-solid fa-gauge-high"></i>'; // Dashboard Icon
        adminBtn.title = 'Admin Dashboard';
        adminBtn.style.color = 'var(--secondary-color)'; // Make it stand out

        // Insert as first icon
        headerIcons.insertBefore(adminBtn, headerIcons.firstChild);
    }

    // 3. Mobile Menu Handling
    const navList = document.querySelector('.nav-list');
    if (navList) {
        // Find existing Sign In link
        const signInLink = Array.from(navList.querySelectorAll('a')).find(a => a.getAttribute('href') === 'signin.html');

        if (signInLink) {
            signInLink.textContent = `Hi, ${user.name} (My Orders)`;
            signInLink.href = 'my-orders.html';

            // Add Admin Link for Mobile
            if (user.role === 'admin' && !document.getElementById('mobile-admin-link')) {
                const adminLi = document.createElement('li');
                adminLi.className = 'mobile-only';
                adminLi.id = 'mobile-admin-link';
                adminLi.innerHTML = '<a href="admin.html" class="nav-link" style="color: var(--secondary-color);">Admin Dashboard</a>';
                signInLink.parentElement.before(adminLi);
            }

            // Add Logout Link (if not already there)
            if (!document.getElementById('mobile-logout')) {
                const logoutLi = document.createElement('li');
                logoutLi.className = 'mobile-only';
                logoutLi.innerHTML = '<a href="#" id="logout-btn" class="nav-link">Logout</a>';
                signInLink.parentElement.after(logoutLi);
            }
        }
    }

    // 4. Desktop Logout Icon
    if (headerIcons && !document.getElementById('desktop-logout-btn')) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'icon-btn';
        logoutBtn.id = 'desktop-logout-btn';
        logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>'; // Logout Icon
        logoutBtn.title = 'Logout';

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });

        headerIcons.appendChild(logoutBtn);
    }
}

function logout() {
    localStorage.removeItem('trendstore_user');
    window.location.reload();
}
