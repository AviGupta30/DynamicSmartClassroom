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

    // --- STATIC DATA (Expanded Schedule & Leaves) ---
    const staticDashboardData = {
        "teacherName": TEACHER_NAME,
        "totalCourses": 5,
        "totalStudents": 180,
        "classSchedule": [
            // MONDAY
            { 
                "course": "Digital Electronics", "section": "ECE-A", "day": "Monday", "time": "11:00 AM - 12:00 PM",
                "faculty": TEACHER_NAME, "room": "C204", "startHour": 11, "durationHours": 1
            }, 
            {
                "course": "Mobile Dev Lab", "section": "CS-B", "day": "Monday", "time": "2:00 PM - 4:00 PM",
                "faculty": TEACHER_NAME, "room": "Lab 4A", "startHour": 14, "durationHours": 2
            },
            // TUESDAY
            {
                "course": "Data Structures", "section": "CS-A", "day": "Tuesday", "time": "9:00 AM - 10:00 AM",
                "faculty": TEACHER_NAME, "room": "LH-101", "startHour": 9, "durationHours": 1
            },
            {
                "course": "Discrete Mathematics", "section": "CS-B", "day": "Tuesday", "time": "11:00 AM - 12:00 PM",
                "faculty": TEACHER_NAME, "room": "C205", "startHour": 11, "durationHours": 1
            },
            // WEDNESDAY
            {
                "course": "Digital Electronics", "section": "ECE-A", "day": "Wednesday", "time": "10:00 AM - 11:00 AM",
                "faculty": TEACHER_NAME, "room": "C204", "startHour": 10, "durationHours": 1
            },
            {
                "course": "Project Mentoring", "section": "Final Year", "day": "Wednesday", "time": "3:00 PM - 5:00 PM",
                "faculty": TEACHER_NAME, "room": "Conf Room 2", "startHour": 15, "durationHours": 2
            },
            // THURSDAY
            {
                "course": "Data Structures", "section": "CS-A", "day": "Thursday", "time": "9:00 AM - 10:00 AM",
                "faculty": TEACHER_NAME, "room": "LH-101", "startHour": 9, "durationHours": 1
            },
            {
                "course": "Mobile Dev Theory", "section": "CS-B", "day": "Thursday", "time": "1:00 PM - 2:00 PM",
                "faculty": TEACHER_NAME, "room": "LH-102", "startHour": 13, "durationHours": 1
            },
            // FRIDAY
            {
                "course": "Faculty Meeting", "section": "Staff", "day": "Friday", "time": "4:00 PM - 5:00 PM",
                "faculty": TEACHER_NAME, "room": "Main Hall", "startHour": 16, "durationHours": 1
            }
        ],
        "facultyOnLeave": [
            { "name": "Dr. Alok Verma", "dept": "Physics", "avatar": "https://i.pravatar.cc/32?img=33" }, 
            { "name": "Prof. Sarah Jenkins", "dept": "Mathematics", "avatar": "https://i.pravatar.cc/32?img=5" },
            { "name": "Dr. R.K. Gupta", "dept": "Mechanical", "avatar": "https://i.pravatar.cc/32?img=12" }
        ]
    };

    const staticClassroomsData = [{
        "id": "EC201", "name": "Digital Electronics", "section": "ECE-A", "bgColor": "bg-1"
    }, {
        "id": "cs-b-md", "name": "Mobile Development", "section": "CS-B", "bgColor": "bg-4"
    }, {
        "id": "cs-b-dm", "name": "Discrete Mathematics", "section": "CS-B", "bgColor": "bg-3"
    }, {
        "id": "cs-a-ds", "name": "Data Structures", "section": "CS-A", "bgColor": "bg-2"
    }];

    // --- MOCK STUDENTS LIST ---
    const studentsByClass = {
        "EC201": [
            { roll: "201", name: "Diya Verma" }, { roll: "202", name: "Anaya Kaur" }, 
            { roll: "203", name: "Saanvi Jain" }, { roll: "204", name: "Aadhya Arora" },
            { roll: "205", name: "Rohan Das" }, { roll: "206", name: "Ishaan Kumar" }
        ],
        "cs-b-md": [
            { roll: "101", name: "Aarav Sharma" }, { roll: "102", name: "Vivaan Gupta" },
            { roll: "103", name: "Aditya Singh" }
        ],
        "cs-b-dm": [
            { roll: "105", name: "Arjun Mishra" }, { roll: "106", name: "Sai Patel" }
        ],
        "cs-a-ds": [
            { roll: "108", name: "Ayaan Joshi" }, { roll: "109", name: "Krishna Das" },
            { roll: "110", name: "Meera Reddy" }, { roll: "111", name: "Kabir Singh" }
        ]
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

    // Attendance DOM
    const attendanceDateInput = document.getElementById('attendance-date');
    const loadAttendanceBtn = document.getElementById('load-attendance-btn');
    const saveAttendanceBtn = document.getElementById('save-attendance-btn');
    const attendanceTableBody = document.querySelector('#attendance-table tbody');
    const markAllPBtn = document.getElementById('mark-all-p');
    const markAllABtn = document.getElementById('mark-all-a');

    // Announcement DOM
    const announcementTextarea = document.getElementById('announcement-textarea');
    const postAnnouncementBtn = document.getElementById('post-announcement-btn');
    const streamPostsContainer = document.getElementById('stream-posts-container');

    // Weather DOM
    const weatherTabBtns = document.querySelectorAll('.weather .tab');
    const weatherContents = document.querySelectorAll('.weather .content');

    const TIMETABLE_START_HOUR = 8;
    const TIMETABLE_END_HOUR = 18;
    let currentClassroomId = null; 

    // --- INITIALIZE DATE PICKER ---
    if(attendanceDateInput) attendanceDateInput.valueAsDate = new Date();

    // ==========================================
    //  1. WEATHER LOGIC (Open-Meteo API)
    // ==========================================
    const fetchWeather = async () => {
        // Using Delhi Coordinates for demo
        const lat = 28.61;
        const long = 77.20;
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=auto`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            // Helper to interpret WMO codes
            const getWeatherDesc = (code) => {
                if (code === 0) return { text: "Clear Sky", icon: "☀️", status: "Campus Open" };
                if (code >= 1 && code <= 3) return { text: "Partly Cloudy", icon: "⛅", status: "Campus Open" };
                if (code >= 45 && code <= 48) return { text: "Foggy", icon: "🌫️", status: "Drive Safe" };
                if (code >= 51 && code <= 67) return { text: "Rainy", icon: "Vm🌧️", status: "Carry Umbrella" };
                if (code >= 71) return { text: "Snow", icon: "❄️", status: "Possible Delays" };
                if (code >= 95) return { text: "Thunderstorm", icon: "⛈️", status: "Stay Indoors" };
                return { text: "Unknown", icon: "❓", status: "Normal" };
            };

            // Update Today
            const todayCode = data.daily.weathercode[0];
            const todayInfo = getWeatherDesc(todayCode);
            document.getElementById('today-weather-icon').textContent = todayInfo.icon;
            document.getElementById('today-weather-desc').textContent = `${todayInfo.text} (${data.daily.temperature_2m_max[0]}°C)`;
            document.getElementById('today-campus-status').textContent = todayInfo.status;
            document.getElementById('today-online-prob').textContent = `Rain Prob: ${data.daily.precipitation_probability_max[0]}%`;

            // Update Tomorrow
            const tomCode = data.daily.weathercode[1];
            const tomInfo = getWeatherDesc(tomCode);
            document.getElementById('tomorrow-weather-icon').textContent = tomInfo.icon;
            document.getElementById('tomorrow-weather-desc').textContent = `${tomInfo.text} (${data.daily.temperature_2m_max[1]}°C)`;
            document.getElementById('tomorrow-campus-status').textContent = tomInfo.status;
            document.getElementById('tomorrow-online-prob').textContent = `Rain Prob: ${data.daily.precipitation_probability_max[1]}%`;

        } catch (error) {
            console.error("Weather fetch failed:", error);
            document.getElementById('today-weather-desc').textContent = "Unavailable";
        }
    };

    // Weather Tabs Logic
    weatherTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            weatherTabBtns.forEach(b => b.classList.remove('active'));
            weatherContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.tab);
            if(target) target.classList.add('active');
        });
    });


    // ==========================================
    //  2. DASHBOARD DATA & RENDERING
    // ==========================================

    function renderFacultyLeaves(facultyList) {
        if (!facultyOnLeaveList) return;
        facultyOnLeaveList.innerHTML = '';
        
        if (facultyList.length === 0) {
            facultyOnLeaveList.innerHTML = '<li style="color:#888; font-style:italic;">No faculty on leave today.</li>';
            return;
        }

        facultyList.forEach(faculty => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.gap = '10px';
            li.style.marginBottom = '10px';
            li.style.padding = '8px';
            li.style.background = 'var(--bg-card)';
            li.style.borderRadius = '8px';
            li.style.border = '1px solid var(--border-color)';

            li.innerHTML = `
                <img src="${faculty.avatar}" alt="${faculty.name}" style="width:32px; height:32px; border-radius:50%;">
                <div>
                    <div style="font-weight:bold; font-size:0.9rem;">${faculty.name}</div>
                    <div style="font-size:0.8rem; color:#666;">${faculty.dept}</div>
                </div>
            `;
            facultyOnLeaveList.appendChild(li);
        });
    }

    function setupTimetableGrid() {
        if (!scheduleGridEl) return;
        scheduleGridEl.innerHTML = '';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Headers
        days.forEach((day, index) => {
            const header = document.createElement('div');
            header.className = 'day-header'; 
            header.textContent = day; 
            header.style.gridColumn = index + 2;
            scheduleGridEl.appendChild(header);
        });

        // Rows
        for (let hour = TIMETABLE_START_HOUR; hour < TIMETABLE_END_HOUR; hour++) {
            const row = (hour - TIMETABLE_START_HOUR) + 2;
            
            // Time Label
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-slot'; 
            timeLabel.textContent = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'AM' : 'PM'}`; 
            timeLabel.style.gridRow = row;
            scheduleGridEl.appendChild(timeLabel);
            
            // Grid Cells
            for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
                const bgCell = document.createElement('div'); 
                bgCell.className = 'grid-cell-bg'; 
                bgCell.style.gridRow = row; 
                bgCell.style.gridColumn = dayIndex + 2;
                scheduleGridEl.appendChild(bgCell);
            }
        }
    }

    function populateTimetable(classSchedule) {
        if (!scheduleGridEl) return;
        const dayMapping = { Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6 };
        
        classSchedule.forEach(cls => {
            const currentHour = cls.startHour; 
            const dayCol = dayMapping[cls.day];
            
            if (dayCol === undefined) return;
            
            const rowStart = (currentHour - TIMETABLE_START_HOUR) + 2;
            const classCard = document.createElement('div'); 
            classCard.className = 'class-card';
            classCard.style.gridRow = `${rowStart} / span ${cls.durationHours}`; 
            classCard.style.gridColumn = `${dayCol}`;
            
            // Color coding based on course name (simple hash)
            const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fbe9e7'];
            const colorIndex = cls.course.length % colors.length;
            classCard.style.backgroundColor = colors[colorIndex];
            classCard.style.borderLeft = `4px solid ${['#2196f3', '#9c27b0', '#4caf50', '#ff9800', '#ff5722'][colorIndex]}`;
            classCard.style.color = '#333';

            classCard.innerHTML = `
                <div class="course-name" style="font-weight:bold; font-size:0.85rem;">${cls.course}</div>
                <div class="details" style="font-size:0.75rem;">${cls.room}</div>
                <div class="details" style="font-size:0.75rem;">${cls.section}</div>
            `;
            scheduleGridEl.appendChild(classCard);
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
    //  3. ANNOUNCEMENT & ATTENDANCE LOGIC
    // ==========================================
    
    // Fetch and Display Announcements
    const fetchAnnouncements = async () => {
        if (!currentClassroomId || !streamPostsContainer) return;
        streamPostsContainer.innerHTML = '<p style="text-align:center; color:#666;">Loading posts...</p>';
        try {
            const res = await fetch(`/api/classrooms/${currentClassroomId}/announcements`);
            if(!res.ok) throw new Error("Failed to fetch posts");
            const posts = await res.json();
            streamPostsContainer.innerHTML = ''; 
            if (posts.length === 0) {
                streamPostsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">No announcements yet. Start the conversation!</div>';
                return;
            }
            posts.forEach(post => {
                const postEl = document.createElement('div');
                postEl.className = 'stream-post';
                postEl.style.cssText = `background: var(--bg-card); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border-color); box-shadow: 0 2px 4px rgba(0,0,0,0.05);`;
                postEl.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:32px; height:32px; background:#667eea; border-radius:50%; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold;">${post.author.charAt(0)}</div>
                            <strong style="color:var(--text-main);">${post.author}</strong>
                        </div>
                        <span style="color:#888; font-size:0.85rem;">${post.date}</span>
                    </div>
                    <div style="color:var(--text-main); line-height:1.5; white-space: pre-wrap;">${post.content}</div>
                    <div style="text-align:right; margin-top:10px;">
                        <button onclick="deleteAnnouncement('${post.id}')" style="background:none; border:none; color:#dc3545; cursor:pointer; font-size:0.85rem;"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                `;
                streamPostsContainer.appendChild(postEl);
            });
        } catch (error) {
            streamPostsContainer.innerHTML = '<p style="color:red; text-align:center;">Error loading announcements.</p>';
        }
    };

    // Post New Announcement
    const postAnnouncement = async () => {
        if (!currentClassroomId) return;
        const content = announcementTextarea.value.trim();
        if (!content) return alert("Please write something!");
        const originalText = postAnnouncementBtn.textContent;
        postAnnouncementBtn.disabled = true;
        postAnnouncementBtn.textContent = "Posting...";
        try {
            const res = await fetch(`/api/classrooms/${currentClassroomId}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content, author: TEACHER_NAME })
            });
            if (res.ok) {
                announcementTextarea.value = ''; 
                fetchAnnouncements(); 
            } else throw new Error("Server rejected post");
        } catch (error) {
            alert("Error posting: " + error.message);
        } finally {
            postAnnouncementBtn.disabled = false;
            postAnnouncementBtn.textContent = originalText;
        }
    };

    window.deleteAnnouncement = async (id) => {
        if(!confirm("Delete this announcement?")) return;
        try {
            const res = await fetch(`/api/classrooms/${currentClassroomId}/announcements/${id}`, { method: 'DELETE' });
            if (res.ok) fetchAnnouncements();
        } catch (e) { alert("Could not delete."); }
    };

    if (postAnnouncementBtn) postAnnouncementBtn.addEventListener('click', postAnnouncement);

    // Attendance Logic
    const loadAttendance = async () => {
        if (!currentClassroomId) return;
        const date = attendanceDateInput.value;
        if (!date) return alert("Select a date.");
        const students = studentsByClass[currentClassroomId] || [];
        attendanceTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
        try {
            const res = await fetch(`/api/attendance/${currentClassroomId}/${date}`);
            const savedRecords = res.ok ? await res.json() : [];
            const statusMap = {};
            const remarkMap = {};
            savedRecords.forEach(r => { statusMap[r.student_roll] = r.status; remarkMap[r.student_roll] = r.remarks || ""; });
            attendanceTableBody.innerHTML = '';
            if (students.length === 0) {
                attendanceTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No students found.</td></tr>';
                return;
            }
            students.forEach(student => {
                const tr = document.createElement('tr');
                const existingStatus = statusMap[student.roll] || 'P'; 
                const existingRemark = remarkMap[student.roll] || "";
                tr.innerHTML = `
                    <td>${student.roll}</td><td>${student.name}</td>
                    <td><span class="status-btn status-${existingStatus.toLowerCase()}" data-status="${existingStatus}" onclick="toggleStatus(this)">${existingStatus}</span></td>
                    <td><input type="text" class="remark-input" value="${existingRemark}" placeholder="Optional..." style="width:100%; padding:5px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-input); color:var(--text-main);"></td>
                `;
                attendanceTableBody.appendChild(tr);
            });
        } catch (error) { attendanceTableBody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Error loading.</td></tr>'; }
    };

    window.toggleStatus = (btn) => {
        const current = btn.dataset.status;
        let newStatus = current === 'P' ? 'A' : (current === 'A' ? 'L' : 'P');
        btn.textContent = newStatus;
        btn.dataset.status = newStatus;
        btn.className = `status-btn status-${newStatus.toLowerCase()}`;
    };

    const markAll = (status) => {
        attendanceTableBody.querySelectorAll('.status-btn').forEach(btn => {
            btn.textContent = status; btn.dataset.status = status; btn.className = `status-btn status-${status.toLowerCase()}`;
        });
    };

    const saveAttendance = async () => {
        if (!currentClassroomId) return;
        const date = attendanceDateInput.value;
        const records = [];
        attendanceTableBody.querySelectorAll('tr').forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length >= 3) {
                records.push({
                    classroom_id: currentClassroomId, date: date, student_roll: cols[0].textContent, student_name: cols[1].textContent,
                    status: cols[2].querySelector('.status-btn').dataset.status, remarks: cols[3].querySelector('input').value
                });
            }
        });
        if(records.length === 0) return alert("No records.");
        try {
            saveAttendanceBtn.textContent = "Saving..."; saveAttendanceBtn.disabled = true;
            const res = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records: records }) });
            if (res.ok) alert("Saved successfully!"); else throw new Error("Server error");
        } catch (error) { alert("Error: " + error.message); } finally { saveAttendanceBtn.textContent = "Save Attendance"; saveAttendanceBtn.disabled = false; }
    };

    if (loadAttendanceBtn) loadAttendanceBtn.addEventListener('click', loadAttendance);
    if (saveAttendanceBtn) saveAttendanceBtn.addEventListener('click', saveAttendance);
    if (markAllPBtn) markAllPBtn.addEventListener('click', () => markAll('P'));
    if (markAllABtn) markAllABtn.addEventListener('click', () => markAll('A'));

    // ==========================================
    //  4. DISPLAY & NAVIGATION LOGIC
    // ==========================================
    function displayClassrooms() {
        const classroomGridEl = document.getElementById('teacher-classroom-grid');
        if (!classroomGridEl) return;
        classroomGridEl.innerHTML = ''; 
        const teacherAvatar = 'https://i.pravatar.cc/60?img=12';
        staticClassroomsData.forEach(classroom => {
            const card = document.createElement('div'); card.className = 'classroom-card'; card.dataset.id = classroom.id;
            card.innerHTML = `<div class="card-header ${classroom.bgColor}"><h3><a href="#">${classroom.name}</a></h3><span>${classroom.section}</span></div><div class="card-body"><img src="${teacherAvatar}" alt="Professor"><p class="professor-name">${TEACHER_NAME}</p></div>`;
            card.addEventListener('click', () => {
                currentClassroomId = card.dataset.id;
                document.getElementById('class-detail-title').textContent = classroom.name;
                document.getElementById('class-detail-code').textContent = classroom.section;
                document.querySelector('.class-detail-header').className = `class-detail-header ${classroom.bgColor}`;
                switchView('classroom-detail-view');
                fetchAnnouncements(); loadAttendance();
            });
            classroomGridEl.appendChild(card);
        });
    }

    function switchView(viewId) {
        viewContainers.forEach(c => c.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        const navItem = document.querySelector(`#sidebar-nav li[data-view="${viewId}"]`);
        if(navItem) navItem.classList.add('active');
        
        if (viewId === 'classroom-detail-view') {
            document.querySelector('#classroom-list-view .view-header').classList.add('hidden');
            document.querySelector('.detail-header').classList.remove('hidden');
        } else {
            document.querySelector('#classroom-list-view .view-header').classList.remove('hidden');
            document.querySelector('.detail-header').classList.add('hidden');
        }
    }

    navLinks.forEach(link => link.addEventListener('click', () => {
        const viewId = link.getAttribute('data-view');
        if (viewId) { switchView(viewId); if (viewId === 'classroom-list-view') displayClassrooms(); }
    }));
    if (backToClassroomsBtn) backToClassroomsBtn.addEventListener('click', () => switchView('classroom-list-view'));

    // --- INITIALIZATION ---
    setupTimetableGrid(); 
    displayDashboardData(staticDashboardData);
    displayClassrooms(); 
    fetchWeather(); // Fetch live weather
});