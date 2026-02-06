document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generator-form');
    const outputDiv = document.getElementById('timetable-output');
    const outputControlsDiv = document.getElementById('output-controls');
    const generateBtn = document.querySelector('.generate-btn');
    const addCourseBtn = document.getElementById('add-course-btn');
    const coursesListDiv = document.getElementById('courses-list');
    const addRoomBtn = document.getElementById('add-room-btn');
    const roomsListDiv = document.getElementById('rooms-list');
    const excelUploadInput = document.getElementById('excel-upload');
    const fileNameSpan = document.getElementById('file-name');
    const modal = document.getElementById('saved-schedules-modal');
    const viewSavedBtn = document.getElementById('view-saved-btn');
    const modalCloseBtn = document.querySelector('.modal-close');
    const savedSchedulesContentDiv = document.getElementById('saved-schedules-content');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const adjustmentUiContainer = document.getElementById('adjustment-ui-container');
    const adjustmentFormContainer = document.getElementById('adjustment-form-container');
    const adjustmentForm = document.getElementById('adjustment-form');
    const solutionsContainer = document.getElementById('solutions-container');
    const solutionsListDiv = document.getElementById('solutions-list');
    const backToSchedulesBtn = document.getElementById('back-to-schedules-btn');
    const backToFormBtn = document.getElementById('back-to-form-btn');
    const applyChangesBtn = document.getElementById('apply-changes-btn');
    const facultySelect = document.getElementById('faculty-select');
    const leaveDateInput = document.getElementById('leave-date');

    let lastGeneratedSchedule = null;
    let mainCourseColorMap = new Map();

    function addCourseRow(name = '', hours = '', faculty = '') {
        const newCourseGroup = document.createElement('div');
        newCourseGroup.className = 'course-input-group';
        newCourseGroup.innerHTML = `<input type="text" class="course-name" placeholder="Course Name" value="${name}" required /><input type="number" class="course-hours" placeholder="Hrs/Wk" min="1" max="10" value="${hours}" required /><input type="text" class="course-faculty" placeholder="Faculty Name" value="${faculty}" required />`;
        coursesListDiv.appendChild(newCourseGroup);
    }
    
    function addSingleInputRow(container, value = '', placeholder = '') {
        const newInputGroup = document.createElement('div');
        newInputGroup.className = 'list-input-group';
        newInputGroup.innerHTML = `<input type="text" placeholder="${placeholder}" value="${value}" required />`;
        container.appendChild(newInputGroup);
    }
    
    function resetForm() {
        document.getElementById('section-name').value = '';
        fileNameSpan.textContent = 'No file chosen';
        excelUploadInput.value = null;
        coursesListDiv.innerHTML = '';
        roomsListDiv.innerHTML = '';
        addCourseRow();
        addSingleInputRow(roomsListDiv, '', 'Room Name');
        mainCourseColorMap.clear();
    }

    addCourseBtn.addEventListener('click', () => addCourseRow());
    addRoomBtn.addEventListener('click', () => addSingleInputRow(roomsListDiv, '', 'Room Name'));

    function populateFormWithData(data) {
        coursesListDiv.innerHTML = '';
        roomsListDiv.innerHTML = '';
        if (data.courses && data.courses.length > 0) { data.courses.forEach(course => addCourseRow(course.name, course.hours, course.faculty)); } else { addCourseRow(); }
        if (data.rooms && data.rooms.length > 0) { data.rooms.forEach(name => addSingleInputRow(roomsListDiv, name, 'Room Name')); } else { addSingleInputRow(roomsListDiv, '', 'Room Name'); }
    }

    excelUploadInput.addEventListener('change', async () => {
        const file = excelUploadInput.files[0];
        if (!file) { fileNameSpan.textContent = 'No file chosen'; return; }
        fileNameSpan.textContent = `Uploading: ${file.name}`;
        loadingOverlay.style.display = 'flex';
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/api/upload_excel', { method: 'POST', body: formData });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.detail || 'Failed to upload file'); }
            const data = await response.json();
            populateFormWithData(data);
            fileNameSpan.textContent = `Successfully loaded: ${file.name}`;
        } catch (error) {
            console.error('Error uploading file:', error);
            fileNameSpan.textContent = `Error: ${error.message}`;
            alert(`Error processing file: ${error.message}`);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    });

    function createScheduleGridElement(scheduleData, courseColorMap) {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'schedule-grid';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
        gridContainer.style.gridTemplateRows = `40px repeat(${timeSlots.length}, 60px)`;
        days.forEach((day, index) => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            dayHeader.style.gridRow = '1';
            dayHeader.style.gridColumn = `${index + 2}`;
            gridContainer.appendChild(dayHeader);
        });
        timeSlots.forEach((time, rowIndex) => {
            const gridRow = rowIndex + 2;
            const timeHeader = document.createElement('div');
            timeHeader.className = 'time-slot';
            timeHeader.textContent = time;
            timeHeader.style.gridRow = `${gridRow}`;
            timeHeader.style.gridColumn = '1';
            gridContainer.appendChild(timeHeader);
            days.forEach((day, colIndex) => {
                const gridCol = colIndex + 2;
                const bgCell = document.createElement('div');
                bgCell.className = 'grid-cell-bg';
                bgCell.style.gridRow = `${gridRow}`;
                bgCell.style.gridColumn = `${gridCol}`;
                gridContainer.appendChild(bgCell);
            });
        });
        let localNextColorIndex = 1;
        Object.entries(scheduleData).forEach(([day, dayClasses]) => {
            const dayIndex = days.indexOf(day);
            if (dayIndex === -1) return;
            Object.entries(dayClasses).forEach(([time, classDetails]) => {
                const timeIndex = timeSlots.indexOf(time);
                if (timeIndex === -1) return;
                if (!courseColorMap.has(classDetails.courseName)) {
                    courseColorMap.set(classDetails.courseName, localNextColorIndex);
                    localNextColorIndex = (localNextColorIndex % 5) + 1;
                }
                const colorIndex = courseColorMap.get(classDetails.courseName);
                const classCard = document.createElement('div');
                classCard.className = `class-card color-${colorIndex}`;
                classCard.style.gridRowStart = timeIndex + 2;
                classCard.style.gridColumnStart = dayIndex + 2;
                classCard.innerHTML = `<div class="course-name">${classDetails.courseName}</div><div class="details">${classDetails.facultyName}<br>${classDetails.roomName}</div>`;
                classCard.dataset.entryId = classDetails.entryId;
                gridContainer.appendChild(classCard);
            });
        });
        return gridContainer;
    }

    function renderGridTimetable(scheduleData, unplaced = []) {
        outputDiv.innerHTML = '';
        mainCourseColorMap.clear();
        const gridElement = createScheduleGridElement(scheduleData, mainCourseColorMap);
        outputDiv.appendChild(gridElement);
        if (unplaced && unplaced.length > 0) {
            const unplacedInfo = document.createElement('p');
            unplacedInfo.style.cssText = 'margin-top: 1rem; color: #ff5555; text-align: center;';
            unplacedInfo.textContent = `Could not generate schedule for: ${unplaced.join(', ')}`;
            outputDiv.appendChild(unplacedInfo);
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        generateBtn.textContent = 'Generating...'; generateBtn.disabled = true; loadingOverlay.style.display = 'flex';
        outputControlsDiv.innerHTML = ''; outputDiv.innerHTML = `<div class="placeholder">🧠 Running optimization...</div>`;
        const sectionName = document.getElementById('section-name').value.trim();
        const courses = Array.from(document.querySelectorAll('.course-input-group')).map(g => ({ name: g.querySelector('.course-name').value.trim(), hours: parseInt(g.querySelector('.course-hours').value, 10), faculty: g.querySelector('.course-faculty').value.trim() })).filter(c => c.name && c.hours > 0 && c.faculty);
        const rooms = Array.from(document.querySelectorAll('#rooms-list input')).map(i => i.value.trim()).filter(Boolean);
        const includeLunchBreak = document.getElementById('lunch-break-toggle').checked;
        if (!sectionName || courses.length === 0 || rooms.length === 0) {
            outputDiv.innerHTML = `<div class="placeholder">Please fill out all fields.</div>`;
            generateBtn.textContent = 'Generate Timetable'; generateBtn.disabled = false; loadingOverlay.style.display = 'none'; return;
        }
        try {
            const payload = { courses, rooms, includeLunchBreak };
            const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.detail || `Server error: ${response.status}`); }
            const result = await response.json();
            lastGeneratedSchedule = result.schedule;
            renderGridTimetable(result.schedule, result.unplaced);
            if (result.schedule && Object.keys(result.schedule).length > 0) {
                const saveBtn = document.createElement('button');
                saveBtn.textContent = 'Save This Timetable'; saveBtn.className = 'generate-btn'; saveBtn.style.marginBottom = '20px';
                outputControlsDiv.appendChild(saveBtn);
                saveBtn.addEventListener('click', async () => {
                    if (confirm("Save this timetable?")) {
                        saveBtn.textContent = 'Saving...'; saveBtn.disabled = true;
                        try {
                            const saveResponse = await fetch('/api/save_schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schedule: lastGeneratedSchedule, sectionName: sectionName }) });
                            const saveResult = await saveResponse.json();
                            if (!saveResponse.ok) throw new Error(saveResult.detail);
                            const successMsg = document.createElement('p');
                            successMsg.textContent = saveResult.message; successMsg.style.color = 'lime'; successMsg.style.textAlign = 'center';
                            outputControlsDiv.innerHTML = ''; outputControlsDiv.appendChild(successMsg);
                            resetForm();
                        } catch (error) { alert('Could not save schedule: ' + error.message); saveBtn.textContent = 'Save This Timetable'; saveBtn.disabled = false; }
                    }
                });
            }
        } catch (error) { outputDiv.innerHTML = `<div class="placeholder" style="color: #ff5555;">Error: ${error.message}</div>`;
        } finally { generateBtn.textContent = 'Generate Timetable'; generateBtn.disabled = false; loadingOverlay.style.display = 'none'; }
    });
    
    const fetchAndDisplaySavedSchedules = async () => {
        savedSchedulesContentDiv.innerHTML = '<p>Loading...</p>';
        try {
            const response = await fetch('/api/saved_schedules');
            const masterScheduleData = await response.json();
            if (Object.keys(masterScheduleData).length === 0) { savedSchedulesContentDiv.innerHTML = '<p>No schedules saved.</p>'; return; }
            savedSchedulesContentDiv.innerHTML = '';
            for (const sectionName in masterScheduleData) {
                const scheduleData = {};
                const sectionEntries = masterScheduleData[sectionName];
                sectionEntries.forEach(entry => {
                    if (!scheduleData[entry.day]) scheduleData[entry.day] = {};
                    scheduleData[entry.day][entry.time_slot] = { entryId: entry.entry_id, courseName: entry.course_name, facultyName: entry.faculty_name, roomName: entry.room_name };
                });
                const sectionContainer = document.createElement('div');
                sectionContainer.className = 'saved-section';
                const header = document.createElement('div');
                header.className = 'saved-section-header';
                header.innerHTML = `<span>${sectionName}</span><button class="delete-schedule-btn" data-section="${sectionName}">Delete</button>`;
                const details = document.createElement('div');
                details.className = 'saved-timetable-details';
                const scheduleGrid = createScheduleGridElement(scheduleData, new Map());
                details.appendChild(scheduleGrid);
                const overridesContainer = document.createElement('div');
                overridesContainer.className = 'daily-overrides-container';
                details.appendChild(overridesContainer);
                const today = new Date().toISOString().split('T')[0];
                try {
                    const overrideResponse = await fetch(`/api/schedule/view/${sectionName}?view_date=${today}`);
                    if(overrideResponse.ok){
                        const dailyData = await overrideResponse.json();
                        if (dailyData.overrides.length > 0) {
                            let overridesHTML = '<h4>Changes for Today:</h4><ul class="overrides-list">';
                            dailyData.overrides.forEach(ov => {
                                if (ov.change_type === 'SUBSTITUTE') { overridesHTML += `<li><strong>SUBSTITUTE:</strong> ${ov.original_class.course_name} (${ov.original_class.time_slot}) will be taught by <strong>${ov.new_teacher}</strong>.</li>`; }
                                else if (ov.change_type === 'RESCHEDULE') { overridesHTML += `<li><strong>RESCHEDULED:</strong> ${ov.original_class.course_name} from ${ov.original_class.day} at ${ov.original_class.time_slot} has been moved to <strong>${ov.new_day}, ${ov.new_time_slot}</strong> in room ${ov.new_room}.</li>`; }
                            });
                            overridesHTML += '</ul>';
                            overridesContainer.innerHTML = overridesHTML;
                        }
                    }
                } catch (e) { console.error("Could not fetch overrides:", e); }
                const adjustBtn = document.createElement('button');
                adjustBtn.textContent = 'Make Dynamic Adjustments';
                adjustBtn.className = 'action-btn';
                adjustBtn.style.width = 'auto';
                adjustBtn.style.marginTop = '20px';
                adjustBtn.onclick = () => showAdjustmentUI(sectionEntries, sectionName);
                details.appendChild(adjustBtn);
                sectionContainer.appendChild(header);
                sectionContainer.appendChild(details);
                savedSchedulesContentDiv.appendChild(sectionContainer);
            }
        } catch (error) { savedSchedulesContentDiv.innerHTML = '<p style="color:red;">Could not load schedules.</p>'; console.error(error); }
    };
    
    viewSavedBtn.addEventListener('click', () => {
        fetchAndDisplaySavedSchedules();
        savedSchedulesContentDiv.classList.remove('hidden');
        adjustmentUiContainer.classList.add('hidden');
        modal.style.display = 'block';
    });
    modalCloseBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target == modal) { modal.style.display = 'none'; } });
    clearAllBtn.addEventListener('click', async () => {
        if (confirm("ARE YOU SURE? This will delete ALL schedules.")) {
            try { await fetch('/api/clear_all_schedules', { method: 'POST' }); fetchAndDisplaySavedSchedules();
            } catch (error) { alert(`Error: ${error.message}`); }
        }
    });
    savedSchedulesContentDiv.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-schedule-btn')) {
            const sectionName = event.target.dataset.section;
            if (confirm(`Delete schedule for "${sectionName}"?`)) {
                try { await fetch('/api/delete_schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sectionName }) }); fetchAndDisplaySavedSchedules();
                } catch (error) { alert(`Error: ${error.message}`); }
            }
        } else if (event.target.closest('.saved-section-header')) {
            const details = event.target.closest('.saved-section').querySelector('.saved-timetable-details');
            if (details) { details.classList.toggle('expanded'); }
        }
    });
    
    function showAdjustmentUI(scheduleEntries, sectionName) {
        savedSchedulesContentDiv.classList.add('hidden');
        adjustmentUiContainer.classList.remove('hidden');
        adjustmentFormContainer.classList.remove('hidden');
        solutionsContainer.classList.add('hidden');
        const facultyNames = [...new Set(scheduleEntries.map(entry => entry.faculty_name))];
        facultySelect.innerHTML = facultyNames.map(name => `<option value="${name}">${name}</option>`).join('');
        leaveDateInput.valueAsDate = new Date();
        adjustmentForm.dataset.sectionName = sectionName;
    }

    adjustmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loadingOverlay.style.display = 'flex';
        const teacher_name = facultySelect.value;
        const leave_date = leaveDateInput.value;
        try {
            const response = await fetch('/api/adjustments/find-solutions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacher_name, start_date: leave_date, end_date: leave_date }) });
            if (!response.ok) { const err = await response.json(); throw new Error(err.detail); }
            const data = await response.json();
            displaySolutions(data.solutions);
        } catch (error) { alert(`Error: ${error.message}`);
        } finally { loadingOverlay.style.display = 'none'; }
    });
    
    function displaySolutions(solutions) {
        adjustmentFormContainer.classList.add('hidden');
        solutionsContainer.classList.remove('hidden');
        solutionsListDiv.innerHTML = '';
        if (solutions.length === 0) {
            solutionsListDiv.innerHTML = '<p>No conflicts found. No changes needed.</p>';
            applyChangesBtn.classList.add('hidden');
            return;
        }
        applyChangesBtn.classList.remove('hidden');
        solutions.forEach((conflict, index) => {
            const conflictDiv = document.createElement('div');
            conflictDiv.className = 'conflict-group';
            let optionsHTML = conflict.solutions.map((sol, solIndex) => `<label class="solution-option"><input type="radio" name="conflict-${index}" value="${solIndex}" ${solIndex === 0 ? 'checked' : ''}><span><strong>${sol.type}:</strong> ${sol.details}</span></label>`).join('');
            if (!optionsHTML) { optionsHTML = '<p>No alternative solutions found.</p>'; }
            conflictDiv.innerHTML = `<h4>Conflict: ${conflict.original_class}</h4>${optionsHTML}`;
            conflictDiv.dataset.conflictData = JSON.stringify(conflict);
            solutionsListDiv.appendChild(conflictDiv);
        });
    }
    
    applyChangesBtn.addEventListener('click', async () => {
        loadingOverlay.style.display = 'flex';
        const conflictGroups = solutionsListDiv.querySelectorAll('.conflict-group');
        let changesApplied = 0;
        for (const group of conflictGroups) {
            const selectedRadio = group.querySelector('input[type="radio"]:checked');
            if (!selectedRadio) continue;
            const conflictData = JSON.parse(group.dataset.conflictData);
            const selectedSolution = conflictData.solutions[parseInt(selectedRadio.value, 10)];
            try {
                const response = await fetch('/api/adjustments/apply-solution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entry_id_to_update: conflictData.conflict_entry_id, solution: selectedSolution }) });
                if (!response.ok) { const err = await response.json(); throw new Error(`Failed for ${conflictData.original_class}: ${err.detail}`); }
                changesApplied++;
            } catch (error) {
                alert(error.message);
                loadingOverlay.style.display = 'none';
                return;
            }
        }
        loadingOverlay.style.display = 'none';
        alert(`${changesApplied} changes applied successfully!`);
        fetchAndDisplaySavedSchedules();
        savedSchedulesContentDiv.classList.remove('hidden');
        adjustmentUiContainer.classList.add('hidden');
    });

    backToSchedulesBtn.addEventListener('click', () => {
        savedSchedulesContentDiv.classList.remove('hidden');
        adjustmentUiContainer.classList.add('hidden');
    });
     backToFormBtn.addEventListener('click', () => {
        adjustmentFormContainer.classList.remove('hidden');
        solutionsContainer.classList.add('hidden');
    });
});