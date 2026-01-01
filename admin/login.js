document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = 'landing.html';
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Login failed');
    }
});
