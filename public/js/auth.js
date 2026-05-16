document.addEventListener('DOMContentLoaded', () => {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    // If already logged in, redirect to dashboard
    if (localStorage.getItem('nexus_token')) {
        window.location.href = '/dashboard.html';
        return;
    }

    // Toggle between login and register
    function switchTo(target) {
        if (target === 'register') {
            loginBox.hidden = true;
            registerBox.hidden = false;
        } else {
            loginBox.hidden = false;
            registerBox.hidden = true;
        }
    }

    showRegister.addEventListener('click', (e) => { e.preventDefault(); switchTo('register'); });
    showLogin.addEventListener('click', (e) => { e.preventDefault(); switchTo('login'); });

    // Check hash for direct link
    if (window.location.hash === '#register') switchTo('register');

    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('login-error');
        errEl.hidden = true;

        const username = document.getElementById('login-user').value.trim();
        const password = document.getElementById('login-pass').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) { errEl.textContent = data.error; errEl.hidden = false; return; }

            localStorage.setItem('nexus_token', data.token);
            localStorage.setItem('nexus_user', data.username);
            window.location.href = '/dashboard.html';
        } catch {
            errEl.textContent = 'Server unreachable. Make sure the backend is running.';
            errEl.hidden = false;
        }
    });

    // Register
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('register-error');
        errEl.hidden = true;

        const username = document.getElementById('reg-user').value.trim();
        const password = document.getElementById('reg-pass').value;

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) { errEl.textContent = data.error; errEl.hidden = false; return; }

            localStorage.setItem('nexus_token', data.token);
            localStorage.setItem('nexus_user', data.username);
            window.location.href = '/dashboard.html';
        } catch {
            errEl.textContent = 'Server unreachable. Make sure the backend is running.';
            errEl.hidden = false;
        }
    });
});
