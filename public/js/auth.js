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

        const users = JSON.parse(localStorage.getItem('nexus_users') || '[]');
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

        if (!user) { 
            errEl.textContent = 'Invalid username or password.'; 
            errEl.hidden = false; 
            return; 
        }

        localStorage.setItem('nexus_token', 'token-' + user.id);
        localStorage.setItem('nexus_user', user.username);
        window.location.href = '/dashboard.html';
    });

    // Register
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('register-error');
        errEl.hidden = true;

        const username = document.getElementById('reg-user').value.trim();
        const password = document.getElementById('reg-pass').value;

        let users = JSON.parse(localStorage.getItem('nexus_users') || '[]');
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            errEl.textContent = 'Username already taken.'; 
            errEl.hidden = false; 
            return; 
        }

        const newUser = { id: Date.now().toString(), username, password };
        users.push(newUser);
        localStorage.setItem('nexus_users', JSON.stringify(users));

        localStorage.setItem('nexus_token', 'token-' + newUser.id);
        localStorage.setItem('nexus_user', newUser.username);
        window.location.href = '/dashboard.html';
    });
});
