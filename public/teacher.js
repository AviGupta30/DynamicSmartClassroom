document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const TEACHER_NAME = "Dr. Devkar Sharma";

    // --- THEME SWITCHER LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
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
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
    applySavedTheme();

    // --- DATA: FULL SCHEDULE & LEAVES ---
    const staticDashboardData = {
        "teacherName": TEACHER_NAME,
        "totalCourses": 5,
        "totalStudents": 180,
        "classSchedule": [
            // MONDAY
            { "course": "Digital Electronics", "section": "ECE-A", "day": "Monday", "time": "11:00 AM - 12:00 PM", "faculty": TEACHER_NAME, "room": "C204", "startHour": 11, "durationHours": 1 }, 
            { "course": "Mobile Dev Lab", "section": "CS-B", "day": "Monday", "time": "2:00 PM - 4:00 PM", "faculty": TEACHER_NAME, "room": "Lab 4A", "startHour": 14, "durationHours": 2 },
            // TUESDAY
            { "course": "Data Structures", "section": "CS-A", "day": "Tuesday", "time": "9:00 AM - 10:00 AM", "faculty": TEACHER_NAME, "room": "LH-101", "startHour": 9, "durationHours": 1 },
            { "course": "Discrete Mathematics", "section": "CS-B", "day": "Tuesday", "time": "11:00 AM - 12:00 PM", "faculty": TEACHER_NAME, "room": "C205", "startHour": 11, "durationHours": 1 },
            // WEDNESDAY
            { "course": "Digital Electronics", "section": "ECE-A", "day": "Wednesday", "time": "10:00 AM - 11:00 AM", "faculty": TEACHER_NAME, "room": "C204", "startHour": 10, "durationHours": 1 },
            { "course": "Project Mentoring", "section": "Final Year", "day": "Wednesday", "time": "3:00 PM - 5:00 PM", "faculty": TEACHER_NAME, "room": "Conf Room 2", "startHour": 15, "durationHours": 2 },
            // THURSDAY
            { "course": "Data Structures", "section": "CS-A", "day": "Thursday", "time": "9:00 AM - 10:00 AM", "faculty": TEACHER_NAME, "room": "LH-101", "startHour": 9, "durationHours": 1 },
            { "course": "Mobile Dev Theory", "section": "CS-B", "day": "Thursday", "time": "1:00 PM - 2:00 PM", "faculty": TEACHER_NAME, "room": "LH-102", "startHour": 13, "durationHours": 1 },
            // FRIDAY
            { "course": "Faculty Meeting", "section": "Staff", "day": "Friday", "time": "4:00 PM - 5:00 PM", "faculty": TEACHER_NAME, "room": "Main Hall", "startHour": 16, "durationHours": 1 }
        ],
        "facultyOnLeave": [
            { "name": "Dr. Alok Verma", "dept": "Physics", "avatar": "https://i.pravatar.cc/32?img=33" }, 
            { "name": "Prof. Sarah Jenkins", "dept": "Mathematics", "avatar": "https://i.pravatar.cc/32?img=5" },
            { "name": "Dr. R.K. Gupta", "dept": "Mechanical", "avatar": "https://i.pravatar.cc/32?img=12" }
        ]
    };

    const staticClassroomsData = [
        { "id": "EC201", "name": "Digital Electronics", "section": "ECE-A", "bgColor": "bg-1" }, 
        { "id": "cs-b-md", "name": "Mobile Development", "section": "CS-B", "bgColor": "bg-4" }, 
        { "id": "cs-b-dm", "name": "Discrete Mathematics", "section": "CS-B", "bgColor": "bg-3" }, 
        { "id": "cs-a-ds", "name": "Data Structures", "section": "CS-A", "bgColor": "bg-2" }
    ];

    const studentsByClass = {
        "EC201": [ { roll: "201", name: "Diya Verma" }, { roll: "202", name: "Anaya Kaur" }, { roll: "203", name: "Saanvi Jain" }, { roll: "204", name: "Aadhya Arora" } ],
        "cs-b-md": [ { roll: "101", name: "Aarav Sharma" }, { roll: "102", name: "Vivaan Gupta" } ],
        "cs-b-dm": [ { roll: "105", name: "Arjun Mishra" }, { roll: "106", name: "Sai Patel" } ],
        "cs-a-ds": [ { roll: "108", name: "Ayaan Joshi" }, { roll: "109", name: "Krishna Das" } ]
    };

    // --- DOM REFERENCES ---
    const teacherNameEl = document.getElementById('teacher-name');
    const totalCoursesEl = document.getElementById('totalCourses');
    const totalStudentsEl = document.getElementById('totalStudents');
    const facultyOnLeaveList = document.getElementById('facultyOnLeaveList');
    const scheduleGridEl = document.getElementById('schedule-grid');
    const navLinks = document.querySelectorAll('#sidebar-nav li');
    const viewContainers = document.querySelectorAll('.view-container');
    const backToClassroomsBtn = document.getElementById('back-to-classrooms-btn');

    // Tab Elements
    const detailTabsContainer = document.querySelector('.class-detail-tabs');
    const tabPanes = document.querySelectorAll('.tab-content-pane');

    // Attendance & Announcement DOM
    const attendanceDateInput = document.getElementById('attendance-date');
    const loadAttendanceBtn = document.getElementById('load-attendance-btn');
    const saveAttendanceBtn = document.getElementById('save-attendance-btn');
    const attendanceTableBody = document.querySelector('#attendance-table tbody');
    const markAllPBtn = document.getElementById('mark-all-p');
    const markAllABtn = document.getElementById('mark-all-a');
    const announcementTextarea = document.getElementById('announcement-textarea');
    const postAnnouncementBtn = document.getElementById('post-announcement-btn');
    const streamPostsContainer = document.getElementById('stream-posts-container');

    const TIMETABLE_START_HOUR = 8;
    const TIMETABLE_END_HOUR = 18;
    let currentClassroomId = null; 

    if(attendanceDateInput) attendanceDateInput.valueAsDate = new Date();

    // ==========================================
    //  1. TAB SWITCHING LOGIC (FIXED)
    // ==========================================
    if (detailTabsContainer) {
        detailTabsContainer.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.tab-btn');
            if (!clickedTab) return;

            // 1. Remove active class from all tabs
            detailTabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            
            // 2. Add active class to clicked tab
            clickedTab.classList.add('active');

            // 3. Get target ID
            const targetId = clickedTab.dataset.target;

            // 4. Hide all panes, Show target pane
            tabPanes.forEach(pane => {
                if (pane.id === targetId) {
                    pane.classList.remove('hidden');
                } else {
                    pane.classList.add('hidden');
                }
            });
        });
    }

    // ==========================================
    //  2. WEATHER LOGIC (Open-Meteo)
    // ==========================================
    const fetchWeather = async () => {
        const lat = 28.61; const long = 77.20; // Delhi
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=auto`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            const getWeatherDesc = (code) => {
                if (code === 0) return { text: "Clear", icon: "☀️", status: "Open" };
                if (code <= 3) return { text: "Cloudy", icon: "⛅", status: "Open" };
                if (code >= 51) return { text: "Rain", icon: "🌧️", status: "Carry Umbrella" };
                return { text: "Normal", icon: "🌤️", status: "Open" };
            };

            const today = data.daily;
            const tInfo = getWeatherDesc(today.weathercode[0]);
            const tmInfo = getWeatherDesc(today.weathercode[1]);

            // Today
            document.getElementById('today-weather-icon').textContent = tInfo.icon;
            document.getElementById('today-weather-desc').textContent = `${tInfo.text} (${today.temperature_2m_max[0]}°C)`;
            document.getElementById('today-campus-status').textContent = tInfo.status;
            document.getElementById('today-online-prob').textContent = `Rain Prob: ${today.precipitation_probability_max[0]}%`;

            // Tomorrow
            document.getElementById('tomorrow-weather-icon').textContent = tmInfo.icon;
            document.getElementById('tomorrow-weather-desc').textContent = `${tmInfo.text} (${today.temperature_2m_max[1]}°C)`;
            document.getElementById('tomorrow-campus-status').textContent = tmInfo.status;
            document.getElementById('tomorrow-online-prob').textContent = `Rain Prob: ${today.precipitation_probability_max[1]}%`;

        } catch (error) { console.error("Weather error:", error); }
    };

    // Weather Tabs
    document.querySelectorAll('.weather .tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.weather .tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.weather .content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // ==========================================
    //  3. DASHBOARD RENDERING
    // ==========================================
    function renderFacultyLeaves(list) {
        if(!facultyOnLeaveList) return;
        facultyOnLeaveList.innerHTML = list.length ? '' : '<li>No leaves today.</li>';
        list.forEach(f => {
            facultyOnLeaveList.innerHTML += `
                <li style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:8px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">
                    <img src="${f.avatar}" style="width:32px; height:32px; border-radius:50%;">
                    <div><div style="font-weight:bold; font-size:0.9rem;">${f.name}</div><div style="font-size:0.8rem; color:#666;">${f.dept}</div></div>
                </li>`;
        });
    }

    function setupTimetableGrid() {
        if (!scheduleGridEl) return;
        scheduleGridEl.innerHTML = '';
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((d, i) => {
            const h = document.createElement('div'); h.className = 'day-header'; h.textContent = d; h.style.gridColumn = i + 2;
            scheduleGridEl.appendChild(h);
        });
        for (let h = TIMETABLE_START_HOUR; h < TIMETABLE_END_HOUR; h++) {
            const r = (h - TIMETABLE_START_HOUR) + 2;
            const t = document.createElement('div'); t.className = 'time-slot'; t.textContent = `${h%12||12}:00`; t.style.gridRow = r;
            scheduleGridEl.appendChild(t);
            for (let d = 0; d < 5; d++) {
                const c = document.createElement('div'); c.className = 'grid-cell-bg'; c.style.gridRow = r; c.style.gridColumn = d + 2;
                scheduleGridEl.appendChild(c);
            }
        }
    }

    function populateTimetable(schedule) {
        if (!scheduleGridEl) return;
        const dayMap = { Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6 };
        const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fbe9e7'];
        
        schedule.forEach(cls => {
            const col = dayMap[cls.day];
            if (!col) return;
            const row = (cls.startHour - TIMETABLE_START_HOUR) + 2;
            const card = document.createElement('div'); 
            card.className = 'class-card';
            card.style.gridRow = `${row} / span ${cls.durationHours}`; 
            card.style.gridColumn = `${col}`;
            card.style.backgroundColor = colors[cls.course.length % colors.length];
            card.style.borderLeft = `4px solid #667eea`;
            card.style.color = '#333';
            card.innerHTML = `<div style="font-weight:bold; font-size:0.8rem;">${cls.course}</div><div style="font-size:0.7rem;">${cls.room}</div>`;
            scheduleGridEl.appendChild(card);
        });
    }

    function displayDashboardData(data) {
        if(teacherNameEl) teacherNameEl.textContent = data.teacherName;
        if(totalCoursesEl) totalCoursesEl.textContent = data.totalCourses;
        if(totalStudentsEl) totalStudentsEl.textContent = data.totalStudents;
        populateTimetable(data.classSchedule);
        renderFacultyLeaves(data.facultyOnLeave);
    }

    // ==========================================
    //  4. ANNOUNCEMENT & ATTENDANCE
    // ==========================================
    const fetchAnnouncements = async () => {
        if (!currentClassroomId || !streamPostsContainer) return;
        streamPostsContainer.innerHTML = 'Loading...';
        try {
            const res = await fetch(`/api/classrooms/${currentClassroomId}/announcements`);
            const posts = res.ok ? await res.json() : [];
            streamPostsContainer.innerHTML = posts.length ? '' : '<p>No announcements.</p>';
            posts.forEach(p => {
                streamPostsContainer.innerHTML += `
                    <div class="stream-post" style="background:var(--bg-card); padding:15px; margin-bottom:10px; border-radius:8px; border:1px solid var(--border-color);">
                        <strong>${p.author}</strong> <span style="color:#888; font-size:0.8rem;">${p.date}</span>
                        <p>${p.content}</p>
                        <button onclick="deleteAnnouncement('${p.id}')" style="color:red; background:none; border:none; cursor:pointer;">Delete</button>
                    </div>`;
            });
        } catch (e) { streamPostsContainer.innerHTML = 'Error.'; }
    };

    const postAnnouncement = async () => {
        if (!currentClassroomId) return;
        const content = announcementTextarea.value.trim();
        if (!content) return;
        await fetch(`/api/classrooms/${currentClassroomId}/announcements`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content, author: TEACHER_NAME })
        });
        announcementTextarea.value = ''; fetchAnnouncements();
    };
    if (postAnnouncementBtn) postAnnouncementBtn.addEventListener('click', postAnnouncement);

    window.deleteAnnouncement = async (id) => {
        if(confirm("Delete?")) {
            await fetch(`/api/classrooms/${currentClassroomId}/announcements/${id}`, { method: 'DELETE' });
            fetchAnnouncements();
        }
    };

    const loadAttendance = async () => {
        if (!currentClassroomId) return;
        const date = attendanceDateInput.value;
        if (!date) return alert("Select date");
        const students = studentsByClass[currentClassroomId] || [];
        attendanceTableBody.innerHTML = 'Loading...';
        
        const res = await fetch(`/api/attendance/${currentClassroomId}/${date}`);
        const saved = res.ok ? await res.json() : [];
        const map = {}; saved.forEach(r => map[r.student_roll] = r);

        attendanceTableBody.innerHTML = '';
        students.forEach(s => {
            const rec = map[s.roll] || { status: 'P', remarks: '' };
            attendanceTableBody.innerHTML += `
                <tr>
                    <td>${s.roll}</td><td>${s.name}</td>
                    <td><span class="status-btn status-${rec.status.toLowerCase()}" data-status="${rec.status}" onclick="toggleStatus(this)">${rec.status}</span></td>
                    <td><input type="text" value="${rec.remarks}" style="width:100%;"></td>
                </tr>`;
        });
    };
    if (loadAttendanceBtn) loadAttendanceBtn.addEventListener('click', loadAttendance);

    window.toggleStatus = (btn) => {
        const s = btn.dataset.status === 'P' ? 'A' : (btn.dataset.status === 'A' ? 'L' : 'P');
        btn.textContent = s; btn.dataset.status = s; btn.className = `status-btn status-${s.toLowerCase()}`;
    };

    const saveAttendance = async () => {
        const records = [];
        attendanceTableBody.querySelectorAll('tr').forEach(r => {
            const cols = r.querySelectorAll('td');
            if(cols.length) records.push({
                classroom_id: currentClassroomId, date: attendanceDateInput.value,
                student_roll: cols[0].textContent, student_name: cols[1].textContent,
                status: cols[2].querySelector('span').dataset.status, remarks: cols[3].querySelector('input').value
            });
        });
        await fetch('/api/attendance', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({records}) });
        alert("Saved!");
    };
    if (saveAttendanceBtn) saveAttendanceBtn.addEventListener('click', saveAttendance);
    if (markAllPBtn) markAllPBtn.addEventListener('click', () => { attendanceTableBody.querySelectorAll('.status-btn').forEach(b => {b.textContent='P'; b.dataset.status='P'; b.className='status-btn status-p';}) });
    if (markAllABtn) markAllABtn.addEventListener('click', () => { attendanceTableBody.querySelectorAll('.status-btn').forEach(b => {b.textContent='A'; b.dataset.status='A'; b.className='status-btn status-a';}) });

    // ==========================================
    //  5. NAVIGATION
    // ==========================================
    function displayClassrooms() {
        const grid = document.getElementById('teacher-classroom-grid');
        if (!grid) return;
        grid.innerHTML = '';
        staticClassroomsData.forEach(c => {
            const card = document.createElement('div'); card.className = 'classroom-card';
            card.innerHTML = `<div class="card-header ${c.bgColor}"><h3>${c.name}</h3><span>${c.section}</span></div><div class="card-body"><p>${TEACHER_NAME}</p></div>`;
            card.addEventListener('click', () => {
                currentClassroomId = c.id;
                document.getElementById('class-detail-title').textContent = c.name;
                document.getElementById('class-detail-code').textContent = c.section;
                document.querySelector('.class-detail-header').className = `class-detail-header ${c.bgColor}`;
                switchView('classroom-detail-view');
                fetchAnnouncements(); loadAttendance();
            });
            grid.appendChild(card);
        });
    }

    function switchView(viewId) {
        viewContainers.forEach(c => c.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        const nav = document.querySelector(`#sidebar-nav li[data-view="${viewId}"]`);
        if(nav) nav.classList.add('active');

        if (viewId === 'classroom-detail-view') {
            document.querySelector('#classroom-list-view .view-header').classList.add('hidden');
            document.querySelector('.detail-header').classList.remove('hidden');
        } else {
            document.querySelector('#classroom-list-view .view-header').classList.remove('hidden');
            document.querySelector('.detail-header').classList.add('hidden');
        }
    }

    navLinks.forEach(l => l.addEventListener('click', () => {
        const id = l.dataset.view;
        if(id) { switchView(id); if(id==='classroom-list-view') displayClassrooms(); }
    }));
    if(backToClassroomsBtn) backToClassroomsBtn.addEventListener('click', () => switchView('classroom-list-view'));

    // Init
    setupTimetableGrid(); 
    displayDashboardData(staticDashboardData);
    displayClassrooms(); 
    fetchWeather();
});