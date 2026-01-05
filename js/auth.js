document.addEventListener('DOMContentLoaded', () => {

    // --- SIGN UP ---
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
                const data = await res.json();
                if (res.ok) {
                    alert('Registration successful! Please sign in.');
                    window.location.href = 'signin.html';
                } else {
                    alert(data.message || 'Registration failed');
                }
            } catch (err) {
                console.error(err);
                alert('Error connecting to server');
            }
        });
    }

    // --- SIGN IN ---
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        const resetOption = document.getElementById('reset-option');

        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Reset UI
            if (resetOption) resetOption.style.display = 'none';

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    // Save user to localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', 'dummy-jwt-token'); // If using JWT
                    window.location.href = 'index.html';
                } else {
                    alert(data.message || 'Login failed');
                    // Show Reset Option if password incorrect
                    if (res.status === 401 && resetOption) {
                        resetOption.style.display = 'block';
                    }
                }
            } catch (err) {
                console.error(err);
                alert('Error connecting to server');
            }
        });
    }

    // --- FORGOT PASSWORD (Send Link) ---
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
                const data = await res.json();

                // Always show success message for security (or honest message)
                // Backend returns "If account exists..."
                alert(data.message);

            } catch (err) {
                console.error(err);
                alert('Error connecting to server');
            } finally {
                btn.innerText = 'Link Sent';
            }
        });
    }

    // --- RESET PASSWORD (Set New Password with Token) ---
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        // 1. Get Token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            alert('Invalid or missing reset token.');
            window.location.href = 'signin.html';
            return;
        }

        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const btn = resetPasswordForm.querySelector('button');
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth/reset-password', {
                    method: 'POST', // Changed from PUT to POST per new route
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });
                const data = await res.json();

                if (res.ok) {
                    alert(data.message);
                    window.location.href = 'signin.html';
                } else {
                    alert(data.message || 'Reset failed');
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert('Error connecting to server');
                btn.disabled = false;
            }
        });
    }

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logout-btn'); // If you add one
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'signin.html';
        });
    }
});
