// game_control.js - Handles global game events like Stop
(function () {
    const evtSource = new EventSource('/api/game/events');

    evtSource.addEventListener('stop', (e) => {
        console.log('Game Stop Event Received');
        // Save current URL to return later
        // We only save if we are NOT already on app.html
        if (!window.location.pathname.includes('app.html')) {
            localStorage.setItem('lastPage', window.location.href);
            window.location.href = 'app.html';
        }
    });

    evtSource.addEventListener('reset', (e) => {
        console.log('Game Reset Event Received');
        // Reload the page to reflect reset state
        // Only if we are on main.html or quiz_play.html
        if (window.location.pathname.includes('main.html') || window.location.pathname.includes('quiz_play.html')) {
            window.location.reload();
        }
    });

    evtSource.addEventListener('force_logout', (e) => {
        console.log('Force Logout Event Received');
        window.location.href = 'index.html';
    });

    // We can also handle 'start' here if we want a unified handler, 
    // but app.html handles 'start' specifically for the waiting screen.
    // However, if a user is on another page and 'start' happens (maybe they reconnected),
    // we might want to ensure they are where they should be. 
    // For now, 'start' is mainly relevant when waiting in app.html.

    // Clean up SSE connection when leaving the page
    window.addEventListener('beforeunload', () => {
        if (evtSource) {
            console.log('Closing SSE connection');
            evtSource.close();
        }
    });
})();
