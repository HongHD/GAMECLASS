document.addEventListener('DOMContentLoaded', async () => {
    const startNewBtn = document.getElementById('startNewBtn');
    const continueBtn = document.getElementById('continueBtn');

    // Check for existing code
    try {
        const response = await fetch('/api/admin/code');
        if (response.ok) {
            const data = await response.json();
            if (data.code) {
                continueBtn.disabled = false;
                continueBtn.textContent = `기존진행 (Code: ${data.code})`;
            }
        }
    } catch (err) {
        console.error('Failed to check existing code:', err);
    }

    // Start New Game
    startNewBtn.addEventListener('click', async () => {
        if (!confirm('새로운 게임을 시작하시겠습니까? 기존 코드는 변경됩니다.')) return;

        try {
            const response = await fetch('/api/admin/generate-code', { method: 'POST' });
            if (response.ok) {
                window.location.href = 'dashboard.html';
            } else {
                alert('Failed to generate new code');
            }
        } catch (err) {
            console.error('Error starting new game:', err);
            alert('Error starting new game');
        }
    });

    // Continue Existing Game
    continueBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
});
