// code_entry.js
const codeForm = document.getElementById('codeForm');

codeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gameCode = document.getElementById('gameCode').value;

    if (!gameCode || gameCode.length !== 4) {
        alert('Please enter a valid 4-digit code.');
        return;
    }

    try {
        const response = await fetch('/api/user/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameCode }),
        });

        const result = await response.json();

        if (response.ok) {
            // Redirect to waiting page
            window.location.href = 'app.html';
        } else {
            alert('Verification failed: ' + result.message);
        }
    } catch (err) {
        console.error('Verification error:', err);
        alert('Network error during verification.');
    }
});
