document.addEventListener('DOMContentLoaded', async () => {
    const blogContainer = document.querySelector('.blog-container');

    // Clear existing content (e.g. "Loading...")
    blogContainer.innerHTML = '<p style="text-align: center; width: 100%;">Loading articles...</p>';

    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();

        blogContainer.innerHTML = '';

        if (posts.length === 0) {
            blogContainer.innerHTML = '<p style="text-align: center; width: 100%;">No articles found.</p>';
            return;
        }

        posts.forEach(post => {
            const article = document.createElement('article');
            article.className = 'blog-card';

            // Format Date
            const date = new Date(post.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            article.innerHTML = `
                <div class="blog-img">
                    <img src="${post.image}" alt="${post.title}">
                    <span class="blog-category">${post.category}</span>
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="date"><i class="far fa-calendar"></i> ${date}</span>
                        <span class="author"><i class="far fa-user"></i> Admin</span>
                    </div>
                    <h3>${post.title}</h3>
                    <p>${post.excerpt}</p>
                    <a href="#" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
                </div>
            `;

            blogContainer.appendChild(article);
        });

    } catch (err) {
        console.error('Error fetching blog posts:', err);
        blogContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Failed to load articles.</p>';
    }
});
