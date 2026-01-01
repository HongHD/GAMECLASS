// monitoring.js - Real-time ranking monitoring
const rankingList = document.getElementById('rankingList');
const resetDataBtn = document.getElementById('resetDataBtn');
const gotoQuizListBtn = document.getElementById('gotoQuizListBtn');
const forceLogoutBtn = document.getElementById('forceLogoutBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Fetch Admin Info
async function loadAdminInfo() {
    try {
        const adminRes = await fetch('/api/admin/me');
        if (adminRes.ok) {
            const adminData = await adminRes.json();
            const adminNameDisplay = document.getElementById('adminNameDisplay');
            if (adminNameDisplay && adminData.admin) {
                adminNameDisplay.textContent = `ID: ${adminData.admin.id}`;
            }
        } else if (adminRes.status === 401) {
            window.location.href = 'login.html';
        }

        // Fetch Game Code
        const codeRes = await fetch('/api/admin/code');
        if (codeRes.ok) {
            const codeData = await codeRes.json();
            const gameCodeDisplay = document.getElementById('gameCodeDisplay');
            if (gameCodeDisplay && codeData.code) {
                gameCodeDisplay.textContent = codeData.code;
            }
        }

        // Initial Fetch of Connected Users
        fetchConnectedUsers();
    } catch (e) {
        console.error('Failed to load admin info:', e);
    }
}
loadAdminInfo();

async function fetchConnectedUsers() {
    try {
        const res = await fetch('/api/user/connected');
        if (res.ok) {
            const users = await res.json();
            renderConnectedUsers(users);
        }
    } catch (err) {
        console.error(err);
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = 'login.html';
        } catch (e) {
            console.error(e);
            alert('Logout failed');
        }
    });
}

if (forceLogoutBtn) {
    forceLogoutBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to FORCE LOGOUT ALL users?')) {
            try {
                const res = await fetch('/api/user/force-logout', { method: 'POST' });
                const result = await res.json();
                if (res.ok) {
                    alert(result.message);
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (e) {
                console.error(e);
                alert('Network error.');
            }
        }
    });
}

if (resetDataBtn) {
    resetDataBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset ALL user progress? This cannot be undone.')) {
            try {
                const res = await fetch('/api/quiz/history', {
                    method: 'DELETE'
                });
                const result = await res.json();
                if (res.ok) {
                    alert(result.message);
                    // Clear the list locally as well
                    rankingList.innerHTML = '<div style="font-size: 1.5rem; color: #666;">Waiting for completions...</div>';
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (e) {
                console.error(e);
                alert('Network error.');
            }
        }
    });
}

if (gotoQuizListBtn) {
    gotoQuizListBtn.addEventListener('click', () => {
        window.location.href = 'quiz_list.html';
    });
}

function connectSSE() {
    const evtSource = new EventSource('/api/mission/events');

    evtSource.addEventListener('ranking', (e) => {
        try {
            const ranking = JSON.parse(e.data);
            renderRanking(ranking);
        } catch (err) {
            console.error('Error parsing ranking data:', err);
        }
    });

    evtSource.addEventListener('connected_users', (e) => {
        try {
            const users = JSON.parse(e.data);
            renderConnectedUsers(users);
        } catch (err) {
            console.error('Error parsing connected users data:', err);
        }
    });

    evtSource.onerror = (err) => {
        console.error('SSE Error:', err);
        // Browser handles reconnection, but we can log it
    };
}

function renderConnectedUsers(users) {
    const list = document.getElementById('connectedUsersList');
    list.innerHTML = '';

    if (!users || users.length === 0) {
        list.innerHTML = '<li style="color: #666; padding: 10px;">Waiting for users...</li>';
        return;
    }

    users.forEach((user, index) => {
        const li = document.createElement('li');
        li.style.padding = '10px';
        li.style.borderBottom = '1px solid #333';
        li.style.fontSize = '1.2rem';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';

        li.innerHTML = `
            <span>${index + 1}. ${user.ID}</span>
            <span style="font-size: 0.8rem; color: #00BFFF;">Online</span>
        `;
        list.appendChild(li);
    });
}

function renderRanking(ranking) {
    rankingList.innerHTML = '';

    if (ranking.length === 0) {
        rankingList.innerHTML = '<div style="font-size: 1.5rem; color: #666;">Waiting for completions...</div>';
        return;
    }

    ranking.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'ranking-item';

        const date = new Date(item.COMPLETE_DATE);
        const timeStr = date.toLocaleTimeString();

        // Mask phone number for privacy if needed, or show full ID
        // Showing ID and partial phone
        const displayId = item.ID;
        const displayTel = item.TEL ? item.TEL.replace(/(\d{3})\d{4}(\d{4})/, '$1-****-$2') : '';

        li.innerHTML = `
            <div class="rank-num">${index + 1}</div>
            <div class="user-info">
                <div>${displayId}</div>
                <div style="font-size: 1rem; font-weight: normal;">${displayTel}</div>
            </div>
            <div class="time-info">${timeStr}</div>
        `;

        rankingList.appendChild(li);
    });
}

// Initial connection
connectSSE();
