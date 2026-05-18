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
    
    // View & Settings Elements
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-view]');
    const viewSections = document.querySelectorAll('.view-section');
    const settingsForm = document.getElementById('settings-form');
    const settingsNameInput = document.getElementById('settings-name');
    const inlineCalendar = document.getElementById('inline-calendar');

    let tasks = [];
    let currentFilter = 'all';

    // ── Init ────────────────────────────────────────────────────
    displayUser.textContent = username || 'Student';
    settingsNameInput.value = username || '';
    
    // Initialize Flatpickr
    flatpickr(taskDeadline, {
        minDate: "today",
        defaultDate: "today",
        dateFormat: "Y-m-d"
    });
    
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

    // ── Local Storage Helpers ─────────────────────────────────────
    function getUserId() {
        return token ? token.replace('token-', '') : null;
    }

    async function fetchTasks() {
        const allTasks = JSON.parse(localStorage.getItem('nexus_tasks') || '[]');
        const userId = getUserId();
        tasks = allTasks.filter(t => t.userId === userId);
        render();
    }

    async function createTask(taskData) {
        const newTask = {
            id: Date.now().toString(),
            userId: getUserId(),
            title: taskData.title,
            category: taskData.category || 'personal',
            deadline: taskData.deadline || '',
            completed: false,
            createdAt: new Date().toISOString()
        };
        const allTasks = JSON.parse(localStorage.getItem('nexus_tasks') || '[]');
        allTasks.push(newTask);
        localStorage.setItem('nexus_tasks', JSON.stringify(allTasks));
        
        tasks.push(newTask);
        render();
    }

    async function toggleTask(id, completed) {
        const allTasks = JSON.parse(localStorage.getItem('nexus_tasks') || '[]');
        const t = allTasks.find(t => t.id === id);
        if (t) {
            t.completed = completed;
            localStorage.setItem('nexus_tasks', JSON.stringify(allTasks));
        }
    }

    async function removeTask(id) {
        let allTasks = JSON.parse(localStorage.getItem('nexus_tasks') || '[]');
        allTasks = allTasks.filter(t => t.id !== id);
        localStorage.setItem('nexus_tasks', JSON.stringify(allTasks));
    }

    // ── Render ──────────────────────────────────────────────────
    function render() {
        const total = tasks.length;
        const done = tasks.filter(t => t.completed).length;
        statTotal.textContent = total;
        statDone.textContent = done;
        statPending.textContent = total - done;

        // Render Calendar Deadlines
        const deadlines = tasks.filter(t => !t.completed && t.deadline).map(t => t.deadline);
        if (inlineCalendar) {
            inlineCalendar.innerHTML = ''; // reset
            flatpickr(inlineCalendar, {
                inline: true,
                events: deadlines.map(d => new Date(d)),
                onDayCreate: function(dObj, dStr, fp, dayElem) {
                    const dateStr = dayElem.dateObj.toISOString().split('T')[0];
                    if (deadlines.includes(dateStr)) {
                        dayElem.classList.add('has-deadline');
                        dayElem.style.borderBottom = "2px solid var(--accent)";
                    }
                }
            });
        }

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

    // ── View Switching ──────────────────────────────────────────
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const targetView = link.dataset.view;
            viewSections.forEach(sec => {
                if(sec.id === targetView) {
                    sec.style.display = 'block';
                    if (targetView === 'view-calendar') render(); // re-render calendar layout if needed
                } else {
                    sec.style.display = 'none';
                }
            });
            
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('open');
            }
        });
    });

    // ── Settings ────────────────────────────────────────────────
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = settingsNameInput.value.trim();
            if (newName) {
                localStorage.setItem('nexus_user', newName);
                displayUser.textContent = newName;
                greetingText.textContent = `Settings saved, ${newName}!`;
            }
        });
    }

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
