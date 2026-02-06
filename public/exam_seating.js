document.addEventListener('DOMContentLoaded', () => {
    // --- THEME SWITCHER LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-theme');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    });
    // --- END THEME LOGIC ---

    const studentUpload = document.getElementById('student-upload');
    const roomUpload = document.getElementById('room-upload');
    
    const studentStatus = document.getElementById('student-file-status');
    const roomStatus = document.getElementById('room-file-status');
    
    const generateBtn = document.getElementById('generate-btn');
    const outputDiv = document.getElementById('seating-output');
    const loadingOverlay = document.getElementById('loading-overlay');

    let studentsData = [];
    let roomsData = [];

    // Helper to upload and parse MULTIPLE files
    async function handleFileUpload(files, endpoint, statusElement, type) {
        if (!files || files.length === 0) return;
        
        statusElement.textContent = `Processing ${files.length} file(s)...`;
        statusElement.className = 'file-status';
        
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        loadingOverlay.style.display = 'flex';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Upload failed');
            }
            
            const result = await response.json();
            
            if (type === 'students') {
                studentsData = result.students; 
                statusElement.textContent = `✅ Loaded ${studentsData.length} students total`;
            } else {
                roomsData = result.rooms;
                statusElement.textContent = `✅ Loaded ${roomsData.length} rooms total`;
            }
            statusElement.classList.add('success');
            
        } catch (error) {
            console.error(error);
            statusElement.textContent = `❌ Error: ${error.message}`;
            statusElement.style.color = '#ef4444';
            if(type === 'students') studentsData = [];
            else roomsData = [];
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    // Event Listeners for File Inputs
    studentUpload.addEventListener('change', (e) => {
        handleFileUpload(e.target.files, '/api/parse/students', studentStatus, 'students');
    });

    roomUpload.addEventListener('change', (e) => {
        handleFileUpload(e.target.files, '/api/parse/rooms', roomStatus, 'rooms');
    });

    // Generate Button Logic
    generateBtn.addEventListener('click', async () => {
        if (studentsData.length === 0) {
            alert("Please upload at least one Student List file.");
            return;
        }
        if (roomsData.length === 0) {
            alert("Please upload at least one Room Details file.");
            return;
        }

        loadingOverlay.style.display = 'flex';
        loadingOverlay.querySelector('p').textContent = "Running Optimization (this may take a few seconds)...";

        try {
            const response = await fetch('/api/generate_exam_seating', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students: studentsData, rooms: roomsData })
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Optimization failed");
            }
            
            const result = await response.json();
            renderSeating(result.assignments, roomsData);
            
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    });

    function renderSeating(assignments, roomsConfig) {
        outputDiv.innerHTML = '';
        const branchColors = {}; 
        let colorIndex = 1;

        // Group assignments by room
        const byRoom = {};
        assignments.forEach(a => {
            if (!byRoom[a.room_name]) byRoom[a.room_name] = [];
            byRoom[a.room_name].push(a);
            
            // Assign color to branch (Cycle through 5 colors)
            if (!branchColors[a.student.branch]) {
                branchColors[a.student.branch] = (colorIndex++ % 5) + 1;
                if (colorIndex > 5) colorIndex = 1; 
            }
        });

        roomsConfig.forEach(room => {
            const roomDiv = document.createElement('div');
            roomDiv.innerHTML = `<h3 class="room-title">Room: ${room.name}</h3>`;
            
            const grid = document.createElement('div');
            grid.className = 'seat-grid';
            grid.style.gridTemplateColumns = `repeat(${room.cols}, 1fr)`;
            
            // Create empty grid slots
            for(let r=1; r<=room.rows; r++) {
                for(let c=1; c<=room.cols; c++) {
                    const studentData = byRoom[room.name]?.find(a => a.row === r && a.col === c);
                    const seat = document.createElement('div');
                    
                    if (studentData) {
                        const colorClass = `color-${branchColors[studentData.student.branch]}`;
                        seat.className = `seat-card ${colorClass}`;
                        seat.innerHTML = `
                            <div class="roll">${studentData.student.roll_no}</div>
                            <div class="name" title="${studentData.student.name}">${studentData.student.name}</div>
                            <div class="branch">${studentData.student.branch}</div>
                        `;
                    } else {
                        seat.className = 'seat-card empty';
                        seat.innerHTML = 'Empty';
                    }
                    grid.appendChild(seat);
                }
            }
            roomDiv.appendChild(grid);
            outputDiv.appendChild(roomDiv);
        });
    }
});