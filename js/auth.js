document.addEventListener('DOMContentLoaded', () => {

    // --- AUTH STATE MANAGEMENT ---
    const userBtn = document.querySelector('.user-btn');
    const user = JSON.parse(localStorage.getItem('trendstore_user'));

    // Create Dropdown Element
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';

    if (userBtn) {
        // If logged in
        if (user) {
            userBtn.href = '#'; // Disable navigation to signin
            userBtn.innerHTML = `<i class="fa-solid fa-user-check"></i>`; // Change icon

            // ... (Dropdown logic for Desktop - same as before) ...

            // 1. Profile Link
            const profileLink = document.createElement('a');
            profileLink.href = 'my-orders.html';
            profileLink.textContent = `Hello, ${user.name.split(' ')[0]}`;
            dropdown.appendChild(profileLink);

            // 2. Admin Link
            if (user.role === 'admin') {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Admin Portal';
                adminLink.style.fontWeight = '600';
                dropdown.appendChild(adminLink);
            }

            // 3. Logout Button
            const logoutBtn = document.createElement('button');
            logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Logout';
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to log out?')) {
                    localStorage.removeItem('trendstore_user');
                    localStorage.removeItem('token');
                    window.location.href = 'signin.html';
                }
            });
            dropdown.appendChild(logoutBtn);

            userBtn.parentElement.style.position = 'relative';
            userBtn.parentElement.appendChild(dropdown);

            userBtn.addEventListener('click', (e) => {
                e.preventDefault();
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });

            // --- MOBILE MENU AUTH UPDATES ---
            const mobileLinks = document.querySelectorAll('.mobile-only a');
            mobileLinks.forEach(link => {
                // Find the Sign In link by its href
                if (link.getAttribute('href') === 'signin.html') {
                    link.textContent = 'Logout';
                    link.href = '#';
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (confirm('Are you sure you want to log out?')) {
                            localStorage.removeItem('trendstore_user');
                            localStorage.removeItem('token');
                            window.location.href = 'signin.html';
                        }
                    });
                }
            });

        } else {
            // Not logged in
            userBtn.innerHTML = `<i class="fa-regular fa-user"></i>`;
        }
    }


    // Safe JSON Helper
    const safeJson = async (res) => {
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            return { message: text || res.statusText };
        }
    };

    // --- FORM HANDLERS (Signup, Login, Forgot, Reset) ---
    // (Keeping existing logic below)

    // ... [Previous Form Logic for Signup/Login/Reset goes here] ...
    // Since I am overwriting, I will paste the previous reliable logic here again to be safe.

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await safeJson(res);
                if (res.ok) {
                    alert('Registration successful! Please sign in.');
                    window.location.href = 'signin.html';
                } else {
                    alert('Sign Up Failed: ' + (data.message || res.statusText));
                }
            } catch (err) {
                console.error(err);
                alert('Connection Error: ' + err.message);
            }
        });
    }

    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        const resetOption = document.getElementById('reset-option');

        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (resetOption) resetOption.style.display = 'none';

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await safeJson(res);

                if (res.ok) {
                    localStorage.setItem('trendstore_user', JSON.stringify(data.user));
                    localStorage.setItem('token', 'dummy-jwt-token');
                    window.location.href = 'index.html';
                } else {
                    alert('Login Failed: ' + (data.message || res.statusText));
                    if (res.status === 401 && resetOption) {
                        resetOption.style.display = 'block';
                    }
                }
            } catch (err) {
                console.error(err);
                alert('Connection Error: ' + err.message);
            }
        });
    }

    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const btn = forgotForm.querySelector('button');
            const originalText = btn.innerText;

            btn.innerText = 'Sending...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (res.status === 404) {
                    alert('Error: Backend outdated. Redeploy.');
                    return;
                }

                const data = await safeJson(res);
                alert(data.message || 'Request processed.');

            } catch (err) {
                console.error(err);
                alert('Connection Error: ' + err.message);
            } finally {
                btn.innerText = 'Link Sent';
            }
        });
    }

    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            alert('Invalid or missing reset token.');
        }

        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const btn = resetPasswordForm.querySelector('button');
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });

                if (res.status === 404) {
                    alert('Error: Backend outdated.');
                    btn.disabled = false;
                    return;
                }

                const data = await safeJson(res);

                if (res.ok) {
                    alert(data.message);
                    window.location.href = 'signin.html';
                } else {
                    alert('Reset Failed: ' + (data.message || res.statusText));
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert('Connection Error: ' + err.message);
                btn.disabled = false;
            }
        });
    }

    // Legacy Logout (if used elsewhere) - redundant with dropdown but safe to keep
    const legacyLogout = document.getElementById('logout-btn');
    if (legacyLogout && !userBtn) { // Only bind if not using the dropdown logic
        legacyLogout.addEventListener('click', () => {
            localStorage.removeItem('trendstore_user');
            localStorage.removeItem('token');
            window.location.href = 'signin.html';
        });
    }
});
