document.addEventListener('DOMContentLoaded', () => {

    // --- THEME SWITCHER LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('admin_theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            if (themeToggle) themeToggle.checked = true;
        } else {
            body.classList.remove('dark-theme');
            if (themeToggle) themeToggle.checked = false;
        }
    };

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                body.classList.add('dark-theme');
                localStorage.setItem('admin_theme', 'dark');
            } else {
                body.classList.remove('dark-theme');
                localStorage.setItem('admin_theme', 'light');
            }
        });
    }
    applySavedTheme();

    // --- VIEW SWITCHING LOGIC ---
    const navLinks = document.querySelectorAll('#sidebar-nav li');
    const viewContainers = document.querySelectorAll('.view-container');

    function switchView(viewId) {
        // Hide all views
        viewContainers.forEach(container => container.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        // Show target view
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active');

        // Highlight Sidebar Link
        const targetLink = document.querySelector(`#sidebar-nav li[data-view="${viewId}"]`);
        if (targetLink) targetLink.classList.add('active');

        // Fetch data for the specific view when switched
        switch (viewId) {
            case 'main-dashboard-view': fetchAdminDashboardData(); break;
            case 'manage-teachers-view': fetchAndDisplayTeachers(); break;
            case 'manage-students-view': fetchAndDisplayStudents(); break;
            case 'manage-courses-view': fetchAndDisplayCourses(); break;
            
            // --- NEW CASE FOR COMPLAINTS ---
            case 'complaints-view': fetchAndDisplayComplaints(); break; 
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const viewId = link.getAttribute('data-view');
            if (viewId) switchView(viewId);
        });
    });

    // --- NEW: COMPLAINT FUNCTIONS ---
    // 1. Fetch from API
    window.fetchAndDisplayComplaints = async () => {
        const tableBody = document.getElementById('complaints-table-body');
        if (!tableBody) return; // Guard clause

        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading complaints...</td></tr>';

        try {
            const res = await fetch('/api/complaints');
            if (!res.ok) throw new Error("Failed to fetch");
            const complaints = await res.json();

            tableBody.innerHTML = '';
            if (complaints.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No complaints found.</td></tr>';
                return;
            }

            complaints.forEach(c => {
                const date = new Date(c.created_at).toLocaleDateString();
                // Green for resolved, Orange for pending
                const statusColor = c.status === 'Resolved' ? 'color:#28a745' : 'color:#fd7e14';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${c.id}</td>
                    <td>${date}</td>
                    <td><strong>${c.name}</strong><br><small style="color:#666">${c.email}</small></td>
                    <td>${c.subject}</td>
                    <td><div style="max-height:60px; overflow-y:auto; font-size:0.9rem;">${c.message}</div></td>
                    <td style="${statusColor}; font-weight:bold;">${c.status}</td>
                    <td>
                        ${c.status !== 'Resolved' ? 
                          `<button class="action-btn" onclick="resolveComplaint(${c.id})" style="background:#28a745; border-color:#28a745; color:white; padding:5px 10px; font-size:0.8rem; cursor:pointer;">Resolve</button>` 
                          : '<span style="color:#aaa;">-</span>'}
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red">Error loading complaints. Please ensure server is running.</td></tr>';
        }
    };

    // 2. Resolve Action
    window.resolveComplaint = async (id) => {
        if(!confirm("Are you sure you want to mark this issue as resolved?")) return;
        
        try {
            const res = await fetch(`/api/complaints/${id}/resolve`, { method: 'POST' });
            if (res.ok) {
                // Refresh the list immediately to show updated status
                fetchAndDisplayComplaints(); 
            } else {
                alert("Error resolving complaint.");
            }
        } catch (e) {
            console.error(e);
            alert("Connection error.");
        }
    };

    // --- MOCK DATA FOR OTHER TABS ---
    function fetchAdminDashboardData() {
        document.getElementById('total-teachers').textContent = "48";
        document.getElementById('total-students').textContent = "1250";
        document.getElementById('total-courses').textContent = "112";
        document.getElementById('active-classrooms').textContent = "89";
    }
    function fetchAndDisplayTeachers() {
        const mockTeachers = [{ id: 'T001', name: 'Dr. Evelyn Reed', email: 'e.reed@university.edu', courses: 3 }];
        const tbody = document.getElementById('teachers-table-body');
        if(tbody) tbody.innerHTML = mockTeachers.map(t => `<tr><td>${t.id}</td><td>${t.name}</td><td>${t.email}</td><td><button class="action-btn">Edit</button></td></tr>`).join('');
    }
    function fetchAndDisplayStudents() {
        const mockStudents = [{ id: 'S1021', name: 'Avi Gupta', email: 'avi.g@student.edu', section: 'ECE-A' }];
        const tbody = document.getElementById('students-table-body');
        if(tbody) tbody.innerHTML = mockStudents.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.email}</td><td><button class="action-btn">Edit</button></td></tr>`).join('');
    }
    function fetchAndDisplayCourses() {
        const mockCourses = [{ code: 'EC201', name: 'Digital Electronics', credits: 4, teachers: 3 }];
        const tbody = document.getElementById('courses-table-body');
        if(tbody) tbody.innerHTML = mockCourses.map(c => `<tr><td>${c.code}</td><td>${c.name}</td><td>${c.credits}</td><td><button class="action-btn">Edit</button></td></tr>`).join('');
    }

    // --- INITIALIZATION ---
    // Start on Dashboard
    switchView('main-dashboard-view');
});