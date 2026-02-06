document.addEventListener('DOMContentLoaded', () => {

    // --- THEME SWITCHER LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            body.classList.add('light-theme');
            if (themeToggle) themeToggle.checked = true;
        } else {
            body.classList.remove('light-theme');
            if (themeToggle) themeToggle.checked = false;
        }
    };

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                body.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
            } else {
                body.classList.remove('light-theme');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // --- FADE-IN ANIMATION ---
    const addIntersectionObserver = () => {
        const sections = document.querySelectorAll('.fade-in-section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('is-visible');
            });
        }, { threshold: 0.1 });
        sections.forEach(section => observer.observe(section));
    };
    
    // --- HELP MODAL LOGIC (NEW) ---
    const helpBtn = document.getElementById('help-btn');
    const modal = document.getElementById('helpModal');
    const closeBtn = document.querySelector('.close-modal');
    const complaintForm = document.getElementById('complaintForm');

    if (helpBtn && modal) {
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = "block";
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = "none";
        });

        window.addEventListener('click', (e) => {
            if (e.target == modal) modal.style.display = "none";
        });

        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = complaintForm.querySelector('button');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Sending...";
            submitBtn.disabled = true;

            const payload = {
                name: document.getElementById('c-name').value,
                email: document.getElementById('c-email').value,
                subject: document.getElementById('c-subject').value,
                message: document.getElementById('c-message').value
            };

            try {
                const res = await fetch('/api/complaints', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert("Complaint submitted successfully! An admin will review it shortly.");
                    modal.style.display = "none";
                    complaintForm.reset();
                } else {
                    alert("Failed to submit. Please try again.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Server error.");
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- INITIALIZE PAGE ---
    applySavedTheme();
    addIntersectionObserver();
    console.log('SmartFlex homepage loaded successfully.');
});