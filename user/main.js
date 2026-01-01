// main.js - User main page logic
const groupGrid = document.getElementById('groupGrid');
const logoutBtn = document.getElementById('logoutBtn');

// Logout logic
// Logout logic
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch('/api/user/logout', { method: 'POST' });
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Logout failed:', err);
        window.location.href = 'index.html';
    }
});

// Fetch and render groups
// Fetch and render groups
async function loadGroups() {
    // Show loading spinner
    groupGrid.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div>Loading quizzes...</div>
        </div>
    `;

    try {
        const res = await fetch('/api/quiz/dashboard');

        if (res.status === 401) {
            window.location.href = 'index.html';
            return;
        }

        if (!res.ok) throw new Error('Failed to fetch dashboard data');

        const data = await res.json();
        const { groups, structure, progress } = data;
        const solvedQuizIds = new Set(progress.solvedQuizIds || []);

        renderGroups(groups, structure, solvedQuizIds);
    } catch (err) {
        console.error(err);
        groupGrid.innerHTML = '<p style="color: var(--error-color);">Failed to load quiz groups.</p>';
    }
}

function renderGroups(groups, groupQuizzes, solvedQuizIds) {
    groupGrid.innerHTML = '';

    if (groups.length === 0) {
        groupGrid.innerHTML = '<p style="color: var(--text-muted);">No quiz groups available.</p>';
        return;
    }

    // Sort groups to ensure order (assuming alphabetical or numeric order matters for progression)
    // The API already sorts by GROUP ASC

    let previousGroupComplete = true; // First group is always unlocked

    groups.forEach((item, index) => {
        const groupName = item.GROUP;
        const quizIds = groupQuizzes[groupName] || [];

        // Check if this group is complete
        const isComplete = quizIds.length > 0 && quizIds.every(id => solvedQuizIds.has(id));

        // Check if locked: Locked if previous group is NOT complete
        const isLocked = !previousGroupComplete;

        const card = document.createElement('div');
        card.className = 'group-card';
        if (isLocked) card.classList.add('locked');
        if (isComplete) card.classList.add('complete');

        let content = `
            <div class="group-name">${groupName}</div>
            <div class="group-label">Quiz Group</div>
        `;

        if (isLocked) {
            content += `<div class="lock-overlay"><img src="https://img.icons8.com/ios-filled/50/ffffff/lock.png" alt="Locked"></div>`;
        } else if (isComplete) {
            content += `<div class="complete-overlay">Complete</div>`;
        }

        card.innerHTML = content;

        card.addEventListener('click', () => {
            if (isLocked) return; // Do nothing
            // Allow re-playing even if complete
            window.location.href = `quiz_play.html?group=${encodeURIComponent(groupName)}`;
        });

        groupGrid.appendChild(card);

        // Update previousGroupComplete for next iteration
        previousGroupComplete = isComplete;
    });

    // Check if ALL quizzes are solved
    // We can check if the last group is complete (assuming sequential lock)
    // Or better, check if solvedQuizIds size equals total quizzes count
    // But we don't have total count easily here without iterating allQuizzes again.
    // Let's use the groupQuizzes map we built.
    const totalQuizzesCount = Object.values(groupQuizzes).reduce((acc, ids) => acc + ids.length, 0);
    const solvedCount = solvedQuizIds.size;

    console.log(`Debug: Total Quizzes: ${totalQuizzesCount}, Solved: ${solvedCount}`);
    console.log('Debug: Solved IDs:', Array.from(solvedQuizIds));

    if (totalQuizzesCount > 0 && solvedCount >= totalQuizzesCount) {
        console.log('Debug: All quizzes solved! Showing Mission Complete button.');
        showMissionCompleteButton();
    } else {
        console.log('Debug: Not all quizzes solved yet.');
    }
}

function showMissionCompleteButton() {
    const container = document.getElementById('missionCompleteContainer');
    const btn = document.getElementById('missionCompleteBtn');
    if (container && btn) {
        container.style.display = 'block';
        btn.addEventListener('click', async () => {
            if (confirm('Congratulations! Submit your mission completion?')) {
                try {
                    const res = await fetch('/api/mission/complete', { method: 'POST' });
                    const result = await res.json();
                    if (res.ok) {
                        alert(result.message);
                        btn.disabled = true;
                        btn.textContent = 'COMPLETED';
                        btn.style.backgroundColor = '#ccc';
                        btn.style.boxShadow = 'none';
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
}

// --- Speed Game Logic ---
const buzzerContainer = document.getElementById('buzzerContainer');
const buzzerBtn = document.getElementById('buzzerBtn');
const buzzerStatus = document.getElementById('buzzerStatus');

function setupSpeedGameSSE() {
    const eventSource = new EventSource('/api/game/events');

    eventSource.addEventListener('SPEED_GAME_ENTER', (e) => {
        // Show Buzzer but disabled
        buzzerContainer.style.display = 'flex';
        buzzerBtn.disabled = true;
        buzzerBtn.style.backgroundColor = '#95a5a6'; // Gray color
        buzzerBtn.style.transform = 'scale(1)';
        buzzerStatus.textContent = 'Waiting for host to start...';
    });

    eventSource.addEventListener('MISSION_GAME_ENTER', (e) => {
        // Hide Buzzer to show Mission Game
        buzzerContainer.style.display = 'none';
        buzzerStatus.textContent = '';
    });

    eventSource.addEventListener('SPEED_GAME_START', (e) => {
        // Enable Buzzer
        buzzerContainer.style.display = 'flex';
        buzzerBtn.disabled = false;
        buzzerBtn.style.backgroundColor = '#e74c3c';
        buzzerBtn.style.transform = 'scale(1)';
        buzzerStatus.textContent = '';
    });

    eventSource.addEventListener('SPEED_GAME_RESET', (e) => {
        // Keep Buzzer visible but disabled
        buzzerContainer.style.display = 'flex';
        buzzerBtn.disabled = true;
        buzzerBtn.style.backgroundColor = '#95a5a6'; // Gray color
        buzzerBtn.style.transform = 'scale(1)';
        buzzerStatus.textContent = 'Waiting for host to start...';
    });

    // We might not get individual rank updates via SSE for the user, 
    // but we can handle the response from the click.
}

buzzerBtn.addEventListener('click', async () => {
    buzzerBtn.style.transform = 'scale(0.95)';
    try {
        const res = await fetch('/api/game/speed/buzz', { method: 'POST' });
        const data = await res.json();

        if (res.ok) {
            buzzerBtn.disabled = true;
            buzzerBtn.style.backgroundColor = '#27ae60';
            buzzerStatus.textContent = `Rank: ${data.rank}`;
        } else if (res.status === 400 && data.message === 'Already buzzed') {
            buzzerBtn.disabled = true;
            buzzerStatus.textContent = `Rank: ${data.rank}`;
        } else {
            buzzerStatus.textContent = 'Error!';
        }
    } catch (err) {
        console.error(err);
    }
});

// Initial load
loadGroups();
setupSpeedGameSSE();
