// register.js - User registration logic
const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const password = document.getElementById('password').value;
    const tel = document.getElementById('tel').value;

    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, password, tel }),
        });

        const result = await response.json();

        if (response.ok) {
            alert('Registration successful! Redirecting to login...');
            window.location.href = 'index.html';
        } else {
            alert('Registration failed: ' + result.message);
        }
    } catch (err) {
        console.error('Registration error:', err);
        alert('Network error during registration.');
    }
});
