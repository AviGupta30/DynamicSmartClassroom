document.addEventListener('DOMContentLoaded', () => {

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

    // --- STATIC DATA ---
    const staticDashboardData = {
        "teacherName": "Dr. Devkar Sharma",
        "totalCourses": 5,
        "totalStudents": 180,
        "classSchedule": [{ 
            "course": "Digital Electronics", "section": "ECE-A", "day": "Monday", "time": "11:00 AM - 12:00 PM",
            "faculty": "Dr. Devkar Sharma", "room": "C204", "startHour": 11, "durationHours": 1
        }, {
            "course": "Mobile Dev Lab", "section": "CS-B", "day": "Monday", "time": "2:00 PM - 4:00 PM",
            "faculty": "Dr. Devkar Sharma", "room": "Lab 4A", "startHour": 14, "durationHours": 2
        }],
        "facultyOnLeave": [{ "name": "Dr. Brown", "avatar": "https://i.pravatar.cc/32?img=12" }, { "name": "Prof. Johnson", "avatar": "https://i.pravatar.cc/32?img=5" }]
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

    // --- MOCK STUDENTS FOR ATTENDANCE ---
    const studentsByClass = {
        "EC201": [
            { roll: "201", name: "Diya Verma" }, { roll: "202", name: "Anaya Kaur" }, 
            { roll: "203", name: "Saanvi Jain" }, { roll: "204", name: "Aadhya Arora" }
        ],
        "cs-b-md": [
            { roll: "101", name: "Aarav Sharma" }, { roll: "102", name: "Vivaan Gupta" }
        ],
        "cs-b-dm": [
            { roll: "105", name: "Arjun Mishra" }, { roll: "106", name: "Sai Patel" }
        ],
        "cs-a-ds": [
            { roll: "108", name: "Ayaan Joshi" }, { roll: "109", name: "Krishna Das" }
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

    const TIMETABLE_START_HOUR = 8;
    const TIMETABLE_END_HOUR = 18;
    let currentClassroomId = null; 

    // --- INITIALIZE DATE PICKER ---
    if(attendanceDateInput) attendanceDateInput.valueAsDate = new Date();

    // --- ATTENDANCE FUNCTIONS ---
    
    // 1. Load Attendance
    const loadAttendance = async () => {
        if (!currentClassroomId) return;
        const date = attendanceDateInput.value;
        if (!date) return alert("Please select a date.");

        const students = studentsByClass[currentClassroomId] || [];
        attendanceTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

        try {
            // Fetch saved data
            const res = await fetch(`/api/attendance/${currentClassroomId}/${date}`);
            const savedRecords = res.ok ? await res.json() : [];
            
            // Create lookup map
            const statusMap = {};
            const remarkMap = {};
            savedRecords.forEach(r => {
                statusMap[r.student_roll] = r.status;
                remarkMap[r.student_roll] = r.remarks || "";
            });

            attendanceTableBody.innerHTML = '';
            
            if (students.length === 0) {
                attendanceTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No students found for this class.</td></tr>';
                return;
            }

            students.forEach(student => {
                const tr = document.createElement('tr');
                const existingStatus = statusMap[student.roll] || 'P'; // Default Present
                const existingRemark = remarkMap[student.roll] || "";
                
                tr.innerHTML = `
                    <td>${student.roll}</td>
                    <td>${student.name}</td>
                    <td>
                        <span class="status-btn status-${existingStatus.toLowerCase()}" 
                              data-status="${existingStatus}" 
                              onclick="toggleStatus(this)">
                              ${existingStatus}
                        </span>
                    </td>
                    <td>
                        <input type="text" class="remark-input" 
                               value="${existingRemark}" 
                               placeholder="Optional remarks" 
                               style="width:100%; padding:5px; border:1px solid #ccc; border-radius:4px;">
                    </td>
                `;
                attendanceTableBody.appendChild(tr);
            });

        } catch (error) {
            console.error(error);
            attendanceTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error loading attendance.</td></tr>';
        }
    };

    // 2. Toggle Status (P -> A -> L -> P) - EXPORTED TO WINDOW
    window.toggleStatus = (btn) => {
        const current = btn.dataset.status;
        let newStatus = 'P';
        
        if (current === 'P') newStatus = 'A';
        else if (current === 'A') newStatus = 'L'; // Late status
        else if (current === 'L') newStatus = 'P';
        
        btn.textContent = newStatus;
        btn.dataset.status = newStatus;
        // Reset classes and add new ones
        btn.className = `status-btn status-${newStatus.toLowerCase()}`;
    };

    // 3. Mark All Functions
    const markAll = (status) => {
        const buttons = attendanceTableBody.querySelectorAll('.status-btn');
        buttons.forEach(btn => {
            btn.textContent = status;
            btn.dataset.status = status;
            btn.className = `status-btn status-${status.toLowerCase()}`;
        });
    };

    // 4. Save Attendance
    const saveAttendance = async () => {
        if (!currentClassroomId) return;
        const date = attendanceDateInput.value;
        const rows = attendanceTableBody.querySelectorAll('tr');
        const records = [];

        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length >= 3) {
                const roll = cols[0].textContent;
                const name = cols[1].textContent;
                const status = cols[2].querySelector('.status-btn').dataset.status;
                const remarks = cols[3].querySelector('input').value; // Get remarks
                
                records.push({
                    classroom_id: currentClassroomId,
                    date: date,
                    student_roll: roll,
                    student_name: name,
                    status: status,
                    remarks: remarks
                });
            }
        });

        if(records.length === 0) return alert("No records to save.");

        try {
            const saveBtn = document.getElementById('save-attendance-btn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = "Saving...";
            saveBtn.disabled = true;

            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: records })
            });

            if (res.ok) alert("Attendance saved successfully!");
            else throw new Error("Failed to save");
            
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;

        } catch (error) {
            alert("Error saving attendance: " + error.message);
        }
    };

    // Attach Listeners
    if (loadAttendanceBtn) loadAttendanceBtn.addEventListener('click', loadAttendance);
    if (saveAttendanceBtn) saveAttendanceBtn.addEventListener('click', saveAttendance);
    if (markAllPBtn) markAllPBtn.addEventListener('click', () => markAll('P'));
    if (markAllABtn) markAllABtn.addEventListener('click', () => markAll('A'));


    // --- DISPLAY CLASSROOMS ---
    function displayClassrooms() {
        const classroomGridEl = document.getElementById('teacher-classroom-grid');
        if (!classroomGridEl) return;
        
        classroomGridEl.innerHTML = ''; 
        const teacherName = staticDashboardData.teacherName;
        const teacherAvatar = 'https://i.pravatar.cc/60?img=12';

        staticClassroomsData.forEach(classroom => {
            const card = document.createElement('div'); 
            card.className = 'classroom-card';
            card.dataset.id = classroom.id;
            
            card.innerHTML = `
                <div class="card-header ${classroom.bgColor}">
                    <h3><a href="#">${classroom.name}</a></h3>
                    <span>${classroom.section}</span>
                </div>
                <div class="card-body">
                    <img src="${teacherAvatar}" alt="Professor ${teacherName}" />
                    <p class="professor-name">${teacherName}</p>
                </div>`;
            
            card.addEventListener('click', () => {
                currentClassroomId = card.dataset.id;
                
                // Update Header Info
                const header = document.querySelector('.class-detail-header');
                document.getElementById('class-detail-title').textContent = classroom.name;
                document.getElementById('class-detail-code').textContent = classroom.section;
                
                // Reset header classes then add new bg color
                header.className = `class-detail-header ${classroom.bgColor}`;

                // Switch View
                switchView('classroom-detail-view');
                
                // Load Data
                loadAttendance(); // Auto-load attendance
            });
            classroomGridEl.appendChild(card);
        });
    }

    // --- GENERIC TABS LOGIC ---
    const detailTabsContainer = document.querySelector('.class-detail-tabs');
    if (detailTabsContainer) {
        detailTabsContainer.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.tab-btn');
            if (!clickedTab) return;

            const targetPaneId = clickedTab.dataset.target;
            
            // Switch Active Tab
            detailTabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            clickedTab.classList.add('active');

            // Switch Content
            document.querySelectorAll('#classroom-detail-view .tab-content-pane').forEach(pane => {
                pane.classList.toggle('hidden', pane.id !== targetPaneId);
            });
        });
    }

    // --- VIEW NAVIGATION ---
    function switchView(viewId) {
        // Hide all views
        viewContainers.forEach(c => c.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Show target view
        document.getElementById(viewId).classList.add('active');
        
        // Update Sidebar Highlight
        const navItem = document.querySelector(`#sidebar-nav li[data-view="${viewId}"]`);
        if(navItem) navItem.classList.add('active');

        // Toggle Headers
        const detailHeader = document.querySelector('.detail-header');
        const mainHeader = document.querySelector('#classroom-list-view .view-header');
        
        if (viewId === 'classroom-detail-view') {
            if(mainHeader) mainHeader.classList.add('hidden');
            if(detailHeader) detailHeader.classList.remove('hidden');
        } else {
            if(mainHeader) mainHeader.classList.remove('hidden');
            if(detailHeader) detailHeader.classList.add('hidden');
        }
    }

    // Nav Click Handlers
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const viewId = link.getAttribute('data-view');
            if (viewId) { 
                switchView(viewId); 
                if (viewId === 'classroom-list-view') displayClassrooms();
            }
        });
    });

    if (backToClassroomsBtn) {
        backToClassroomsBtn.addEventListener('click', () => switchView('classroom-list-view'));
    }

    // --- INITIALIZATION ---
    function setupTimetableGrid() {
        if (!scheduleGridEl) return;
        scheduleGridEl.innerHTML = '';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        days.forEach((day, index) => {
            const header = document.createElement('div');
            header.className = 'day-header'; header.textContent = day; header.style.gridColumn = index + 2;
            scheduleGridEl.appendChild(header);
        });
        for (let hour = TIMETABLE_START_HOUR; hour < TIMETABLE_END_HOUR; hour++) {
            const row = (hour - TIMETABLE_START_HOUR) + 2;
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-slot'; timeLabel.textContent = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'AM' : 'PM'}`; timeLabel.style.gridRow = row;
            scheduleGridEl.appendChild(timeLabel);
            for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
                const bgCell = document.createElement('div'); bgCell.className = 'grid-cell-bg'; bgCell.style.gridRow = row; bgCell.style.gridColumn = dayIndex + 2;
                scheduleGridEl.appendChild(bgCell);
            }
        }
    }

    function populateTimetable(classSchedule) {
        if (!scheduleGridEl) return;
        const dayMapping = { Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6 };
        classSchedule.forEach(cls => {
            for (let i = 0; i < cls.durationHours; i++) {
                const currentHour = cls.startHour + i; const dayCol = dayMapping[cls.day];
                if (dayCol === undefined) continue;
                const rowStart = (currentHour - TIMETABLE_START_HOUR) + 2;
                const classCard = document.createElement('div'); classCard.className = 'class-card';
                classCard.style.gridRow = `${rowStart} / span 1`; classCard.style.gridColumn = `${dayCol}`;
                classCard.innerHTML = `<div class="course-name">${cls.course}</div><div class="details"><span>Room: ${cls.room}</span></div>`;
                scheduleGridEl.appendChild(classCard);
            }
        });
    }

    function displayDashboardData(data) {
        if(teacherNameEl) teacherNameEl.textContent = data.teacherName;
        if(totalCoursesEl) totalCoursesEl.textContent = data.totalCourses;
        if(totalStudentsEl) totalStudentsEl.textContent = data.totalStudents;
        populateTimetable(data.classSchedule);
    }

    setupTimetableGrid(); 
    displayDashboardData(staticDashboardData);
    displayClassrooms(); // Pre-load classroom list
});