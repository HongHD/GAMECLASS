// login.js - User login logic
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert('Login successful!');
            // Always redirect to code entry to allow user to input/verify code
            window.location.href = 'code_entry.html';
        } else {
            alert('Login failed: ' + result.message);
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Network error during login.');
    }
});
