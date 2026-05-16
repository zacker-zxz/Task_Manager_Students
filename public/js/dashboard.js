document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('nexus_token');
    const username = localStorage.getItem('nexus_user');

    // If not logged in, redirect to login
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // ── DOM Elements ────────────────────────────────────────────
    const displayUser = document.getElementById('display-username');
    const greetingText = document.getElementById('greeting-text');
    const statTotal = document.getElementById('stat-total');
    const statDone = document.getElementById('stat-done');
    const statPending = document.getElementById('stat-pending');
    const taskForm = document.getElementById('task-form');
    const taskTitle = document.getElementById('task-title');
    const taskCategory = document.getElementById('task-category');
    const taskDeadline = document.getElementById('task-deadline');
    const taskListEl = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-chip');
    const logoutBtn = document.getElementById('logout-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    let tasks = [];
    let currentFilter = 'all';

    // ── Init ────────────────────────────────────────────────────
    displayUser.textContent = username || 'Student';
    taskDeadline.min = new Date().toISOString().split('T')[0];
    taskDeadline.value = taskDeadline.min;
    setGreeting();
    fetchTasks();

    // ── Greeting ────────────────────────────────────────────────
    function setGreeting() {
        const h = new Date().getHours();
        let g = 'Good evening';
        if (h < 12) g = 'Good morning';
        else if (h < 17) g = 'Good afternoon';
        greetingText.textContent = `${g}, ${username || 'Student'}!`;
    }

    // ── API Helpers ─────────────────────────────────────────────
    function headers() {
        return { 'Content-Type': 'application/json', 'Authorization': token };
    }

    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks', { headers: headers() });
            if (res.status === 401) { logout(); return; }
            tasks = await res.json();
            render();
        } catch {
            taskListEl.innerHTML = '<div class="empty-state"><i class="ph ph-warning-circle"></i><p>Cannot connect to server.</p></div>';
        }
    }

    async function createTask(task) {
        const res = await fetch('/api/tasks', { method: 'POST', headers: headers(), body: JSON.stringify(task) });
        if (res.status === 401) { logout(); return; }
        const newTask = await res.json();
        tasks.push(newTask);
        render();
    }

    async function toggleTask(id, completed) {
        await fetch(`/api/tasks/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ completed }) });
    }

    async function removeTask(id) {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: headers() });
    }

    // ── Render ──────────────────────────────────────────────────
    function render() {
        const total = tasks.length;
        const done = tasks.filter(t => t.completed).length;
        statTotal.textContent = total;
        statDone.textContent = done;
        statPending.textContent = total - done;

        let list = currentFilter === 'all' ? [...tasks] : tasks.filter(t => t.category === currentFilter);
        list.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        taskListEl.innerHTML = '';

        if (list.length === 0) {
            taskListEl.innerHTML = '<div class="empty-state"><i class="ph ph-clipboard-text"></i><p>No tasks here yet. Add one above!</p></div>';
            return;
        }

        list.forEach((task, i) => {
            const el = document.createElement('div');
            el.className = `task-item${task.completed ? ' completed' : ''}`;
            el.style.animationDelay = `${i * 0.04}s`;
            el.style.transform = 'translateY(8px)';

            const dateStr = task.deadline ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

            el.innerHTML = `
                <button class="task-check${task.completed ? ' done' : ''}" data-id="${task.id}" aria-label="Toggle complete">
                    <i class="ph ph-check"></i>
                </button>
                <div class="task-body">
                    <h4>${escapeHtml(task.title)}</h4>
                    <div class="task-meta">
                        <span class="task-tag ${task.category}">${task.category}</span>
                        ${dateStr ? `<span><i class="ph ph-calendar-blank"></i> ${dateStr}</span>` : ''}
                    </div>
                </div>
                <button class="task-delete" data-id="${task.id}" aria-label="Delete task">
                    <i class="ph ph-trash-simple"></i>
                </button>
            `;
            taskListEl.appendChild(el);
        });

        // Attach events
        taskListEl.querySelectorAll('.task-check').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const task = tasks.find(t => t.id === id);
                task.completed = !task.completed;
                toggleTask(id, task.completed);
                render();
            });
        });

        taskListEl.querySelectorAll('.task-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const item = btn.closest('.task-item');
                item.style.animation = 'taskOut 0.3s ease forwards';
                setTimeout(() => {
                    tasks = tasks.filter(t => t.id !== id);
                    removeTask(id);
                    render();
                }, 300);
            });
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Events ──────────────────────────────────────────────────
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = taskTitle.value.trim();
        if (!title) return;
        createTask({ title, category: taskCategory.value, deadline: taskDeadline.value });
        taskTitle.value = '';
        taskTitle.focus();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    function logout() {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        window.location.href = '/';
    }

    logoutBtn.addEventListener('click', logout);

    // Mobile sidebar toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
});
