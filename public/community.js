document.addEventListener('DOMContentLoaded', () => {
    // --- THEME & VARS ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    if (localStorage.getItem('theme') === 'light') { body.classList.add('light-theme'); themeToggle.checked = true; }
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) { body.classList.add('light-theme'); localStorage.setItem('theme', 'light'); } 
        else { body.classList.remove('light-theme'); localStorage.setItem('theme', 'dark'); }
    });

    const feedContainer = document.getElementById('posts-feed');
    const postCountLabel = document.getElementById('post-count');
    const feedTitle = document.getElementById('feed-title');
    
    // Auth Elements
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const loginModal = document.getElementById('login-modal');
    const passwordInput = document.getElementById('admin-password-input');
    const submitLoginBtn = document.getElementById('submit-login');
    const closeLoginBtn = document.getElementById('close-login');
    
    // Post Elements
    const createPostBtn = document.getElementById('open-post-modal');
    const postModal = document.getElementById('post-modal');
    const closePostModalBtn = document.getElementById('close-modal');
    const createForm = document.getElementById('create-post-form');

    let allPosts = [];
    let isAdmin = false;
    let adminPassword = ""; 
    let currentFilter = 'Notice'; // Default View

    // --- 1. ADMIN LOGIN LOGIC ---
    adminLoginBtn.addEventListener('click', () => loginModal.style.display = 'flex');
    closeLoginBtn.addEventListener('click', () => loginModal.style.display = 'none');
    
    submitLoginBtn.addEventListener('click', () => {
        const pwd = passwordInput.value;
        if (pwd === "admin123") {
            isAdmin = true;
            adminPassword = pwd;
            
            // UI Updates
            loginModal.style.display = 'none';
            adminLoginBtn.classList.add('hidden');
            createPostBtn.classList.remove('hidden');
            
            // Re-render
            renderPosts(getFilteredPosts());
            alert("Admin verified successfully.");
        } else {
            alert("Incorrect password.");
        }
    });

    // --- 2. FETCH & RENDER ---
    async function fetchPosts() {
        try {
            const res = await fetch('/api/community/posts');
            if (!res.ok) throw new Error('Failed to fetch');
            allPosts = await res.json();
            // Render based on CURRENT filter
            renderPosts(getFilteredPosts());
        } catch (err) {
            console.error(err);
            feedContainer.innerHTML = '<p style="text-align:center; color:#ef4444;">Failed to load posts.</p>';
        }
    }

    function getFilteredPosts() {
        // Strict filtering: Only return posts that match the current tag
        return allPosts.filter(p => p.tag === currentFilter);
    }

    window.renderPosts = function(posts) {
        feedContainer.innerHTML = '';
        postCountLabel.textContent = `${posts.length} posts found`;

        if (posts.length === 0) {
            feedContainer.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--text-secondary);">
                    <i class="fa-solid fa-inbox" style="font-size: 3rem; margin-bottom: 10px;"></i>
                    <p>No ${currentFilter.toLowerCase()}s found.</p>
                </div>`;
            return;
        }

        posts.forEach(post => {
            const date = new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const initials = post.author.slice(0, 2).toUpperCase();
            
            const card = document.createElement('div');
            card.className = 'post-card';
            
            let attachmentHTML = '';
            if (post.attachment_url) {
                let iconClass = "fa-paperclip";
                if (post.attachment_url.endsWith('.pdf')) iconClass = "fa-file-pdf";
                else if (post.attachment_url.match(/\.(jpg|jpeg|png)$/i)) iconClass = "fa-file-image";

                attachmentHTML = `
                    <div class="post-attachment">
                        <a href="${post.attachment_url}" target="_blank">
                            <i class="fa-solid ${iconClass}"></i> View Attachment
                        </a>
                    </div>`;
            }

            let deleteBtnHTML = '';
            if (isAdmin) {
                deleteBtnHTML = `<button class="delete-post-btn" onclick="deletePost(${post.id})"><i class="fa-solid fa-trash"></i> Delete</button>`;
            }

            card.innerHTML = `
                <div class="post-meta">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="post-tag tag-${post.tag.toLowerCase()}">${post.tag}</span>
                        <span>${date}</span>
                    </div>
                    ${deleteBtnHTML}
                </div>
                <div class="post-title">${post.title}</div>
                <div class="post-content">${post.content}</div>
                ${attachmentHTML}
                <div class="post-footer">
                    <div class="author-avatar">${initials}</div>
                    <div class="author-info">
                        ${post.author}
                        <span class="author-role">• ${post.role}</span>
                    </div>
                </div>
            `;
            feedContainer.appendChild(card);
        });
    };

    // --- 3. FILTERING ---
    window.filterPosts = function(tag, btnElement) {
        // UI Update: Active class
        document.querySelectorAll('.comm-btn').forEach(btn => btn.classList.remove('active'));
        if(btnElement) btnElement.classList.add('active');

        // Logic Update
        currentFilter = tag;
        
        // Header Update
        if(tag === 'Notice') feedTitle.textContent = "Notices";
        else if(tag === 'Event') feedTitle.textContent = "Events";
        else if(tag === 'General') feedTitle.textContent = "General Discussions";
        else feedTitle.textContent = tag + "s";

        // Re-render
        renderPosts(getFilteredPosts());
    };

    // --- 4. CREATE POST ---
    createPostBtn.addEventListener('click', () => postModal.style.display = 'flex');
    closePostModalBtn.addEventListener('click', () => postModal.style.display = 'none');

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const tagValue = document.getElementById('post-tag').value;
        const formData = new FormData();
        formData.append('title', document.getElementById('post-title').value);
        formData.append('content', document.getElementById('post-content').value);
        formData.append('tag', tagValue);
        formData.append('author', document.getElementById('post-author').value);
        formData.append('role', document.getElementById('post-role').value);
        formData.append('password', adminPassword); 
        
        const fileInput = document.getElementById('post-file');
        if (fileInput.files[0]) {
            formData.append('file', fileInput.files[0]);
        }

        const btn = createForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Posting...';
        btn.disabled = true;

        try {
            const res = await fetch('/api/community/posts', {
                method: 'POST',
                body: formData 
            });

            if (res.ok) {
                createForm.reset();
                postModal.style.display = 'none';
                
                // 1. Fetch updated list
                await fetchPosts();
                
                // 2. Automatically switch filter to the new post's category
                // Find the button corresponding to the tag (lowercased ID selector)
                const targetBtn = document.getElementById(`btn-${tagValue.toLowerCase()}`);
                if(targetBtn) {
                    filterPosts(tagValue, targetBtn);
                } else {
                    // Fallback
                    renderPosts(getFilteredPosts());
                }

            } else {
                const err = await res.json();
                alert('Error: ' + err.detail);
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // --- 5. DELETE POST ---
    window.deletePost = async function(postId) {
        if (!confirm("Are you sure you want to delete this post?")) return;
        
        try {
            const res = await fetch(`/api/community/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'password': adminPassword 
                }
            });
            
            if (res.ok) {
                fetchPosts();
            } else {
                alert("Failed to delete post.");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting post");
        }
    };

    window.addEventListener('click', (e) => {
        if (e.target === postModal) postModal.style.display = 'none';
        if (e.target === loginModal) loginModal.style.display = 'none';
    });

    fetchPosts();
});