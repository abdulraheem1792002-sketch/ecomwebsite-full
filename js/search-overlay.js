// Search Overlay Logic

document.addEventListener('DOMContentLoaded', () => {
    const searchOverlay = document.getElementById('search-overlay');
    const searchBtns = document.querySelectorAll('.search-btn'); // Handle potential multiple buttons (desktop/mobile)
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');

    // Open Search Overlay
    searchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            // Focus input after a small delay to allow transition
            setTimeout(() => searchInput.focus(), 300);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    });

    // Close Search Overlay (Button)
    if (searchClose) {
        searchClose.addEventListener('click', closeSearch);
    }

    // Close Search Overlay (Escape Key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearch();
        }
    });

    // Handle Search Submission
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    // Navigate to search results page
                    // Check if we are in a subdirectory (html/) or root
                    // Better approach: use absolute path relative to site root if possible, 
                    // or detect current location.

                    // Simple path detection for now.
                    // If current URL contains '/html/', we are in html folder.
                    // If we want to go to 'html/search.html'

                    let targetUrl = 'search.html';

                    // If we are at root (index.html at top level), we need to go to html/search.html
                    // BUT per refactor, index usually stays at root, others in html/.
                    // Wait, recent refactor checking showed index.html in `html/`.
                    // Let's assume all pages are in `html/` except potentially the root landing if configured that way.
                    // Since specific structure was confirmed:
                    // c:\Users\djz\Desktop\projs\ecomeweb\html\index.html
                    // All pages are in html/. So 'search.html' is a sibling.

                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    function closeSearch() {
        searchOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        searchInput.value = ''; // Clear input
    }
});
