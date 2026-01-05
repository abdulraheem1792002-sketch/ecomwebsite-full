document.addEventListener('DOMContentLoaded', () => {

    // Helper to safely parse JSON
    const safeJson = async (res) => {
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            return { message: text || res.statusText };
        }
    };

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

    // --- SIGN IN ---
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
                    localStorage.setItem('user', JSON.stringify(data.user));
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

                // If 404, it means the backend route doesn't exist
                if (res.status === 404) {
                    alert('Error: The server cannot find the password reset functionality. Please ensure the backend is redeployed.');
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

    // --- RESET PASSWORD (Set New Password with Token) ---
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            alert('Invalid or missing reset token.');
            // window.location.href = 'signin.html'; // Optional: keep them on page to see error
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
                    alert('Error: The server cannot find the password reset functionality. Backend outdated.');
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

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'signin.html';
        });
    }
});
