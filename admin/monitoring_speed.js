document.addEventListener('DOMContentLoaded', async () => {
    const gameCodeDisplay = document.getElementById('gameCodeDisplay');
    const connectedUsersList = document.getElementById('connectedUsersList');
    const rankingList = document.getElementById('rankingList');
    const startGameBtn = document.getElementById('startGameBtn');
    const resetGameBtn = document.getElementById('resetGameBtn');
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    const forceLogoutBtn = document.getElementById('forceLogoutBtn');

    let currentGameCode = null;

    // 1. Fetch Admin Info & Code
    try {
        // Notify server that admin entered Speed Game page (to redirect users)
        await fetch('/api/game/speed/enter', { method: 'POST' });

        const res = await fetch('/api/admin/me');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('adminNameDisplay').textContent = `ID: ${data.admin.id}`;
        } else {
            window.location.href = 'login.html';
            return;
        }

        const codeRes = await fetch('/api/admin/code');
        if (codeRes.ok) {
            const codeData = await codeRes.json();
            currentGameCode = codeData.code;
            gameCodeDisplay.textContent = currentGameCode || '----';

            // Initial Load
            fetchConnectedUsers();
            fetchRanking();
            setupSSE();
        }
    } catch (err) {
        console.error(err);
    }

    // 2. Button Actions
    startGameBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/game/speed/start', { method: 'POST' });
            if (res.ok) {
                alert('Speed Game Started! Users can now buzz.');
            } else {
                alert('Failed to start game');
            }
        } catch (err) {
            console.error(err);
        }
    });

    resetGameBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to reset the game? This will clear all rankings.')) return;
        try {
            const res = await fetch('/api/game/speed/reset', { method: 'POST' });
            if (res.ok) {
                alert('Game Reset.');
                rankingList.innerHTML = '';
            }
        } catch (err) {
            console.error(err);
        }
    });

    backToDashboardBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    forceLogoutBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to force logout ALL users?')) return;
        try {
            await fetch('/api/user/force-logout-all', { method: 'POST' });
            alert('All users have been logged out.');
        } catch (err) {
            console.error(err);
        }
    });

    // 3. Data Fetching
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

    async function fetchRanking() {
        try {
            const res = await fetch('/api/game/speed/ranking');
            if (res.ok) {
                const rankings = await res.json();
                renderRanking(rankings);
            }
        } catch (err) {
            console.error(err);
        }
    }

    // 4. Rendering
    function renderConnectedUsers(users) {
        connectedUsersList.innerHTML = '';
        if (users.length === 0) {
            connectedUsersList.innerHTML = '<li style="color: #666; padding: 10px;">No users connected</li>';
            return;
        }
        users.forEach(user => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid #333';
            li.style.color = '#fff';
            li.textContent = `${user.ID} (${user.TEL || 'No Tel'})`;
            connectedUsersList.appendChild(li);
        });
    }

    function renderRanking(rankings) {
        rankingList.innerHTML = '';
        rankings.forEach(item => {
            const li = document.createElement('li');
            li.className = 'ranking-item';

            // Format time
            const date = new Date(item.CLICK_TIME);
            const timeStr = date.toLocaleTimeString('ko-KR', { hour12: false }) + '.' + date.getMilliseconds();

            li.innerHTML = `
                <div class="rank-num">${item.RANK_NUM}</div>
                <div class="user-info">${item.ID}</div>
                <div class="time-info">${timeStr}</div>
            `;
            rankingList.appendChild(li);
        });
    }

    // 5. SSE
    function setupSSE() {
        const eventSource = new EventSource('/api/game/events');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // General updates if any
        };

        eventSource.addEventListener('connected_users_update', (e) => {
            fetchConnectedUsers();
        });

        eventSource.addEventListener('SPEED_GAME_RANKING_UPDATE', (e) => {
            fetchRanking();
        });

        eventSource.addEventListener('SPEED_GAME_RESET', (e) => {
            rankingList.innerHTML = '';
        });

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            eventSource.close();
            // Reconnect logic could go here
            setTimeout(setupSSE, 5000);
        };
    }
});
