import random
import pandas as pd
from datetime import date, datetime
from typing import List, Optional, Dict
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request, Form, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from collections import defaultdict
import uuid
import io
import math
import os
import shutil

from ortools.sat.python import cp_model

import models
import schemas
from database import engine, get_db

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

UPLOAD_DIR = "public/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

announcements_db = {
    "EC201": [ 
        { "id": str(uuid.uuid4()), "author": "J Panda", "date": "Sep 28", "content": "Welcome to Digital Electronics! The syllabus has been posted under the Classwork tab." }
    ],
    "EC207": [], "EC209": [], "cs-b-md": [], 
}

def get_or_create(db: Session, model, name: str):
    instance = db.query(model).filter(model.name == name).first()
    if not instance:
        instance = model(name=name)
        db.add(instance)
        db.commit()
        db.refresh(instance)
    return instance

# --- TIMETABLE: EXCEL UPLOAD ---
@app.post("/api/upload_excel")
async def handle_excel_upload(file: UploadFile = File(...)):
    if not file or not file.filename: raise HTTPException(status_code=400, detail="No file selected")
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx') or file.filename.endswith('.xls')): 
        raise HTTPException(status_code=400, detail="Invalid file type.")
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith('.csv') else pd.read_excel(io.BytesIO(contents))
        df.columns = [col.strip().lower().replace(" ", "") for col in df.columns]
        required = {'courses', 'weeklyhours', 'faculty', 'rooms'}
        if not required.issubset(df.columns): raise HTTPException(400, f"Missing required columns: {', '.join(required)}")
        courses = [{'name': str(r['courses']), 'hours': int(r['weeklyhours']), 'faculty': str(r['faculty'])} for i, r in df.iterrows() if pd.notna(r.get('courses')) and pd.notna(r.get('weeklyhours')) and pd.notna(r.get('faculty'))]
        rooms = df['rooms'].dropna().astype(str).unique().tolist()
        return {"courses": courses, "rooms": rooms}
    except Exception as e: raise HTTPException(500, f"Error processing file: {e}")

# --- TIMETABLE: GET SAVED ---
@app.get("/api/saved_schedules")
async def get_saved_schedules(db: Session = Depends(get_db)):
    all_entries = db.query(models.ScheduleEntry).options(
        joinedload(models.ScheduleEntry.section), joinedload(models.ScheduleEntry.course),
        joinedload(models.ScheduleEntry.teacher), joinedload(models.ScheduleEntry.room)
    ).order_by(models.ScheduleEntry.time_slot).all()
    grouped_schedules = defaultdict(list)
    for entry in all_entries:
        if entry.section:
            grouped_schedules[entry.section.name].append({
                "entry_id": entry.id, "day": entry.day, "time_slot": entry.time_slot,
                "course_name": entry.course.name, "faculty_name": entry.teacher.name,
                "room_name": entry.room.name
            })
    return grouped_schedules

# --- TIMETABLE: GENERATION LOGIC ---
def create_schedule_logic(db: Session, courses: list[schemas.CourseInput], rooms: list[str], include_lunch_break: bool):
    time_slots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']
    if not include_lunch_break: time_slots.insert(4, '1:00 PM')
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    faculty_schedule, room_schedule = set(), set()
    for entry in db.query(models.ScheduleEntry).options(joinedload(models.ScheduleEntry.teacher), joinedload(models.ScheduleEntry.room)).all():
        faculty_schedule.add((entry.day, entry.time_slot, entry.teacher.name))
        room_schedule.add((entry.day, entry.time_slot, entry.room.name))
    classes_to_schedule = []
    for course in courses:
        for _ in range(course.hours): classes_to_schedule.append({'courseName': course.name, 'facultyName': course.faculty})
    random.shuffle(classes_to_schedule)
    schedule, unplaced_courses = {day: {} for day in days}, []
    for class_item in classes_to_schedule:
        placed = False
        faculty = class_item['facultyName']
        possible_slots = [(d, t, r) for d in days for t in time_slots for r in rooms]
        random.shuffle(possible_slots)
        for day, time, room in possible_slots:
            if not ((day, time, faculty) in faculty_schedule) and not ((day, time, room) in room_schedule) and not (time in schedule[day]):
                schedule[day][time] = {'courseName': class_item['courseName'], 'facultyName': faculty, 'roomName': room}
                faculty_schedule.add((day, time, faculty)); room_schedule.add((day, time, room))
                placed = True
                break
        if not placed: unplaced_courses.append(class_item['courseName'])
    return schedule, list(set(unplaced_courses))

@app.post("/api/generate")
async def generate_timetable(payload: schemas.GeneratePayload, db: Session = Depends(get_db)):
    if not payload.courses or not payload.rooms: raise HTTPException(status_code=400, detail="Courses and rooms cannot be empty.")
    try:
        schedule, unplaced = create_schedule_logic(db, payload.courses, payload.rooms, payload.includeLunchBreak)
        return {"schedule": schedule, "unplaced": unplaced}
    except Exception as e: raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# --- TIMETABLE: SAVE/DELETE ---
@app.post("/api/save_schedule")
async def save_schedule(payload: schemas.SaveSchedulePayload, db: Session = Depends(get_db)):
    section = get_or_create(db, models.Section, payload.sectionName)
    db.query(models.ScheduleEntry).filter(models.ScheduleEntry.section_id == section.id).delete()
    new_entries = []
    for day, time_slots in payload.schedule.items():
        for time_slot, details in time_slots.items():
            if details:
                teacher = get_or_create(db, models.Teacher, details.facultyName)
                course = get_or_create(db, models.Course, details.courseName)
                room = get_or_create(db, models.Room, details.roomName)
                
                if course not in teacher.courses:
                    teacher.courses.append(course)
                    db.commit()
                
                new_entries.append(models.ScheduleEntry(section_id=section.id, day=day, time_slot=time_slot, course_id=course.id, teacher_id=teacher.id, room_id=room.id))
    db.add_all(new_entries)
    db.commit()
    return {"message": f"Timetable for {section.name} saved successfully!"}

@app.post("/api/delete_schedule")
async def delete_schedule(payload: schemas.DeleteSchedulePayload, db: Session = Depends(get_db)):
    section = db.query(models.Section).filter(models.Section.name == payload.sectionName).first()
    if not section: raise HTTPException(status_code=404, detail=f"Schedule for '{payload.sectionName}' not found.")
    db.query(models.ScheduleEntry).filter(models.ScheduleEntry.section_id == section.id).delete()
    db.commit()
    return {"message": f"Schedule for {payload.sectionName} deleted."}

@app.post("/api/clear_all_schedules")
async def clear_all_schedules(db: Session = Depends(get_db)):
    db.query(models.ScheduleOverride).delete()
    db.query(models.ScheduleEntry).delete()
    db.commit()
    return {"message": "Cleared all schedule entries and overrides."}

# --- ADJUSTMENT LOGIC ---
def find_solutions_for_conflict(conflict: models.ScheduleEntry, db: Session, all_days: list, all_time_slots: list):
    solutions = []
    conflict_course = db.query(models.Course).options(joinedload(models.Course.teachers)).get(conflict.course_id)
    
    for qualified_teacher in conflict_course.teachers:
        if qualified_teacher.id == conflict.teacher_id: continue
        is_busy = db.query(models.ScheduleEntry).filter(models.ScheduleEntry.teacher_id == qualified_teacher.id, models.ScheduleEntry.day == conflict.day, models.ScheduleEntry.time_slot == conflict.time_slot).first()
        if not is_busy:
            solutions.append(schemas.Solution(type="SUBSTITUTE", details=f"Assign {qualified_teacher.name}", new_teacher_id=qualified_teacher.id))
    
    occupied_section_slots = {(e.day, e.time_slot) for e in db.query(models.ScheduleEntry).filter(models.ScheduleEntry.section_id == conflict.section_id).all()}
    occupied_teacher_slots = {(e.day, e.time_slot) for e in db.query(models.ScheduleEntry).filter(models.ScheduleEntry.teacher_id == conflict.teacher_id).all()}
    potential_slots = [{'day': day, 'time': time} for day in all_days for time in all_time_slots if (day, time) not in occupied_section_slots and (day, time) not in occupied_teacher_slots]
    random.shuffle(potential_slots)
    
    reschedule_count = 0
    for slot in potential_slots:
        if reschedule_count >= 3: break
        occupied_rooms = {e.room_id for e in db.query(models.ScheduleEntry).filter(models.ScheduleEntry.day == slot['day'], models.ScheduleEntry.time_slot == slot['time']).all()}
        all_rooms = {r.id for r in db.query(models.Room).all()}
        available_rooms = all_rooms - occupied_rooms
        if available_rooms:
            free_room_id = available_rooms.pop()
            free_room = db.query(models.Room).get(free_room_id)
            solutions.append(schemas.Solution(type="RESCHEDULE", details=f"Move to {slot['day']}, {slot['time']} in {free_room.name}", new_day=slot['day'], new_time_slot=slot['time'], new_room_id=free_room_id))
            reschedule_count += 1
    return solutions

@app.post("/api/adjustments/find-solutions", response_model=schemas.AdjustmentSolutionPayload)
async def find_adjustment_solutions(payload: schemas.TeacherLeavePayload, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.name == payload.teacher_name).first()
    if not teacher: raise HTTPException(status_code=404, detail="Teacher not found")
    conflicts = db.query(models.ScheduleEntry).options(joinedload(models.ScheduleEntry.course), joinedload(models.ScheduleEntry.section)).filter(models.ScheduleEntry.teacher_id == teacher.id).all()
    if not conflicts: return schemas.AdjustmentSolutionPayload(solutions=[])
    days, slots = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']
    proposed = [schemas.Conflict(conflict_entry_id=e.id, original_class=f"{e.course.name} ({e.section.name}) on {e.day} at {e.time_slot}", solutions=find_solutions_for_conflict(e, db, days, slots)) for e in conflicts]
    return schemas.AdjustmentSolutionPayload(solutions=proposed)

@app.post("/api/adjustments/apply-solution")
async def apply_adjustment_solution(payload: schemas.ApplySolutionPayload, db: Session = Depends(get_db)):
    original_entry = db.query(models.ScheduleEntry).get(payload.entry_id_to_update)
    if not original_entry: raise HTTPException(status_code=404, detail="Original schedule entry not found")
    solution = payload.solution
    override_date = date.today()
    new_override = models.ScheduleOverride(original_entry_id=original_entry.id, override_date=override_date, change_type=solution.type)
    if solution.type == "SUBSTITUTE": new_override.new_teacher_id = solution.new_teacher_id
    elif solution.type == "RESCHEDULE":
        new_override.new_teacher_id = original_entry.teacher_id
        new_override.new_day = solution.new_day
        new_override.new_time_slot = solution.new_time_slot
        new_override.new_room_id = solution.new_room_id
    db.add(new_override)
    db.commit()
    return {"message": f"Override for {override_date} has been saved."}

@app.get("/api/schedule/view/{section_name}")
async def get_daily_schedule(section_name: str, view_date: date, db: Session = Depends(get_db)):
    section = db.query(models.Section).filter(models.Section.name == section_name).first()
    if not section: raise HTTPException(status_code=404, detail="Section not found")
    
    overrides_query = db.query(models.ScheduleOverride).join(models.ScheduleEntry).filter(
        models.ScheduleEntry.section_id == section.id,
        models.ScheduleOverride.override_date == view_date
    )
    overrides = [
        {
            "original_entry_id": ov.original_entry_id, "change_type": ov.change_type,
            "new_teacher": ov.new_teacher.name if ov.new_teacher else None,
            "new_room": ov.new_room.name if ov.new_room else None, "new_day": ov.new_day,
            "new_time_slot": ov.new_time_slot,
            "original_class": {"course_name": ov.original_entry.course.name, "day": ov.original_entry.day, "time_slot": ov.original_entry.time_slot}
        }
        for ov in overrides_query.options(joinedload(models.ScheduleOverride.new_teacher), joinedload(models.ScheduleOverride.new_room), joinedload(models.ScheduleOverride.original_entry).joinedload(models.ScheduleEntry.course)).all()
    ]
    return {"overrides": overrides}

# --- ANNOUNCEMENTS ---
@app.get("/api/classrooms/{classroom_id}/announcements", response_model=List[schemas.Announcement])
async def get_announcements(classroom_id: str):
    if classroom_id not in announcements_db:
        return []
    return sorted(announcements_db[classroom_id], key=lambda x: x['date'], reverse=True)

@app.post("/api/classrooms/{classroom_id}/announcements", response_model=schemas.Announcement)
async def create_announcement(classroom_id: str, announcement: schemas.AnnouncementCreate):
    if classroom_id not in announcements_db:
        announcements_db[classroom_id] = []
    
    new_announcement = schemas.Announcement(
        id=str(uuid.uuid4()),
        author=announcement.author,
        content=announcement.content,
        date=datetime.now().strftime("%b %d")
    )
    announcements_db[classroom_id].append(new_announcement.dict())
    return new_announcement

@app.delete("/api/classrooms/{classroom_id}/announcements/{announcement_id}", status_code=204)
async def delete_announcement(classroom_id: str, announcement_id: str):
    if classroom_id not in announcements_db:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    announcement_list = announcements_db[classroom_id]
    initial_len = len(announcement_list)
    announcements_db[classroom_id] = [ann for ann in announcement_list if ann['id'] != announcement_id]
    
    if len(announcements_db[classroom_id]) == initial_len:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted"}

@app.get("/api/dashboard")
async def get_dashboard_data(): return {"teacherName": "J Panda"}
@app.get("/api/classrooms")
async def get_classrooms_data(): return [{"id": "EC201", "name": "Digital Electronics - ECE-A"}]


# --- SMART SEAT LOGIC (OR-TOOLS) ---
@app.post("/api/parse/students")
async def parse_students_file(files: List[UploadFile] = File(...)):
    all_students = []
    for file in files:
        if not file.filename: continue
        try:
            contents = await file.read()
            if file.filename.endswith('.csv'): df = pd.read_csv(io.BytesIO(contents))
            else: df = pd.read_excel(io.BytesIO(contents))
            
            df.columns = [str(col).strip().lower().replace(" ", "").replace("_", "") for col in df.columns]
            if 'name' not in df.columns or 'branch' not in df.columns: continue
            
            for _, row in df.iterrows():
                if pd.notna(row.get('name')) and pd.notna(row.get('branch')):
                    all_students.append({
                        "name": str(row['name']),
                        "roll_no": str(row['rollno']) if 'rollno' in df.columns and pd.notna(row['rollno']) else "N/A",
                        "branch": str(row['branch'])
                    })
        except Exception as e: raise HTTPException(500, f"Error parsing {file.filename}: {str(e)}")
    return {"students": all_students}

@app.post("/api/parse/rooms")
async def parse_rooms_file(files: List[UploadFile] = File(...)):
    all_rooms = []
    for file in files:
        if not file.filename: continue
        try:
            contents = await file.read()
            if file.filename.endswith('.csv'): df = pd.read_csv(io.BytesIO(contents))
            else: df = pd.read_excel(io.BytesIO(contents))
            
            df.columns = [str(col).strip().lower().replace(" ", "").replace("_", "") for col in df.columns]
            col_map = {c: c for c in df.columns}
            for c in df.columns:
                if 'room' in c: col_map['name'] = c
                if 'row' in c: col_map['rows'] = c
                if 'col' in c: col_map['cols'] = c
                
            if 'name' not in col_map or 'rows' not in col_map or 'cols' not in col_map: continue
                 
            for _, row in df.iterrows():
                if pd.notna(row.get(col_map['name'])):
                    all_rooms.append({
                        "name": str(row[col_map['name']]),
                        "rows": int(row[col_map['rows']]),
                        "cols": int(row[col_map['cols']])
                    })
        except Exception as e: raise HTTPException(500, f"Error parsing {file.filename}: {str(e)}")
    return {"rooms": all_rooms}

def solve_seating_cp_sat(students, rooms):
    model = cp_model.CpModel()
    unique_branches = sorted(list(set(s.branch for s in students)))
    branch_to_id = {b: i + 1 for i, b in enumerate(unique_branches)}
    branch_counts = defaultdict(int)
    students_by_branch = defaultdict(list)
    for s in students:
        branch_counts[branch_to_id[s.branch]] += 1
        students_by_branch[branch_to_id[s.branch]].append(s)

    total_students = len(students)
    total_capacity = sum(r.rows * r.cols for r in rooms)
    
    if total_students > total_capacity:
        raise ValueError(f"Not enough seats! Students: {total_students}, Capacity: {total_capacity}")

    grid_vars = {}
    is_occupied_vars = {}
    penalty_vars = []

    for r_idx, room in enumerate(rooms):
        for r in range(room.rows):
            for c in range(room.cols):
                seat_key = (r_idx, r, c)
                var = model.NewIntVar(0, len(unique_branches), f'seat_{r_idx}_{r}_{c}')
                grid_vars[seat_key] = var
                is_occ = model.NewBoolVar(f'occ_{r_idx}_{r}_{c}')
                model.Add(var > 0).OnlyEnforceIf(is_occ)
                model.Add(var == 0).OnlyEnforceIf(is_occ.Not())
                is_occupied_vars[seat_key] = is_occ

    for b_id, count in branch_counts.items():
        bools_for_branch = []
        for seat_key, var in grid_vars.items():
            b_var = model.NewBoolVar(f'{seat_key}_is_{b_id}')
            model.Add(var == b_id).OnlyEnforceIf(b_var)
            model.Add(var != b_id).OnlyEnforceIf(b_var.Not())
            bools_for_branch.append(b_var)
        model.Add(sum(bools_for_branch) == count)

    HORIZONTAL_PENALTY = 1000 
    VERTICAL_PENALTY = 10     

    for r_idx, room in enumerate(rooms):
        for r in range(room.rows):
            for c in range(room.cols):
                current_seat = grid_vars[(r_idx, r, c)]
                if c < room.cols - 1:
                    right_seat = grid_vars[(r_idx, r, c + 1)]
                    is_same_h = model.NewBoolVar(f'conflict_h_{r_idx}_{r}_{c}')
                    seats_equal = model.NewBoolVar(f'eq_h_{r_idx}_{r}_{c}')
                    model.Add(current_seat == right_seat).OnlyEnforceIf(seats_equal)
                    model.Add(current_seat != right_seat).OnlyEnforceIf(seats_equal.Not())
                    curr_not_empty = is_occupied_vars[(r_idx, r, c)]
                    model.AddBoolAnd([seats_equal, curr_not_empty]).OnlyEnforceIf(is_same_h)
                    model.AddBoolOr([seats_equal.Not(), curr_not_empty.Not()]).OnlyEnforceIf(is_same_h.Not())
                    penalty_vars.append(is_same_h * HORIZONTAL_PENALTY)

                if r < room.rows - 1:
                    down_seat = grid_vars[(r_idx, r + 1, c)]
                    is_same_v = model.NewBoolVar(f'conflict_v_{r_idx}_{r}_{c}')
                    seats_equal_v = model.NewBoolVar(f'eq_v_{r_idx}_{r}_{c}')
                    model.Add(current_seat == down_seat).OnlyEnforceIf(seats_equal_v)
                    model.Add(current_seat != down_seat).OnlyEnforceIf(seats_equal_v.Not())
                    curr_not_empty_v = is_occupied_vars[(r_idx, r, c)]
                    model.AddBoolAnd([seats_equal_v, curr_not_empty_v]).OnlyEnforceIf(is_same_v)
                    model.AddBoolOr([seats_equal_v.Not(), curr_not_empty_v.Not()]).OnlyEnforceIf(is_same_v.Not())
                    penalty_vars.append(is_same_v * VERTICAL_PENALTY)

    if penalty_vars:
        model.Minimize(sum(penalty_vars))

    ideal_per_room = total_students / len(rooms)
    min_per_room = math.floor(ideal_per_room)
    max_per_room = math.ceil(ideal_per_room)
    
    for r_idx, room in enumerate(rooms):
        room_seats = [is_occupied_vars[(r_idx, r, c)] for r in range(room.rows) for c in range(room.cols)]
        model.Add(sum(room_seats) >= min_per_room)
        model.Add(sum(room_seats) <= max_per_room)

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise ValueError("No valid seating arrangement found! Try adding more rooms.")

    assignments = []
    unplaced = []
    for b in students_by_branch: random.shuffle(students_by_branch[b])

    for r_idx, room in enumerate(rooms):
        for r in range(room.rows):
            for c in range(room.cols):
                seat_key = (r_idx, r, c)
                val = solver.Value(grid_vars[seat_key])
                if val > 0:
                    if students_by_branch[val]:
                        student = students_by_branch[val].pop(0)
                        assignments.append(schemas.SeatAssignment(
                            student=student, room_name=room.name, row=r + 1, col=c + 1
                        ))
    return assignments, unplaced

@app.post("/api/generate_exam_seating", response_model=schemas.ExamSeatingResponse)
async def generate_exam_seating(payload: schemas.ExamSeatingPayload):
    try:
        if not payload.students or not payload.rooms: raise ValueError("Students and Rooms data required")
        assignments, unplaced = solve_seating_cp_sat(payload.students, payload.rooms)
        return schemas.ExamSeatingResponse(assignments=assignments, unplaced=unplaced)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

# --- COMMUNITY ENDPOINTS ---
@app.get("/api/community/posts", response_model=List[schemas.PostResponse])
async def get_community_posts(db: Session = Depends(get_db)):
    return db.query(models.CommunityPost).order_by(models.CommunityPost.created_at.desc()).all()

@app.post("/api/community/posts", response_model=schemas.PostResponse)
async def create_community_post(
    title: str = Form(...),
    content: str = Form(...),
    author: str = Form(...),
    role: str = Form(...),
    tag: str = Form(...),
    password: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    if password != "admin123":
        raise HTTPException(status_code=401, detail="Invalid admin password")

    attachment_url = None
    if file:
        file_path = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        attachment_url = f"/uploads/{file.filename}"

    new_post = models.CommunityPost(
        title=title,
        content=content,
        author=author,
        role=role,
        tag=tag,
        attachment_url=attachment_url,
        created_at=datetime.now()
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@app.delete("/api/community/posts/{post_id}")
async def delete_community_post(
    post_id: int, 
    password: str = Header(None), 
    db: Session = Depends(get_db)
):
    if password != "admin123":
        raise HTTPException(status_code=401, detail="Invalid admin password")
        
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.attachment_url:
        try:
            file_name = post.attachment_url.split('/')[-1]
            os.remove(f"{UPLOAD_DIR}/{file_name}")
        except:
            pass

    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}

# --- ATTENDANCE ENDPOINTS ---
@app.get("/api/attendance/{classroom_id}/{date_str}", response_model=List[schemas.AttendanceResponse])
async def get_attendance(classroom_id: str, date_str: str, db: Session = Depends(get_db)):
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    records = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.classroom_id == classroom_id,
        models.AttendanceRecord.date == target_date
    ).all()
    return records

@app.post("/api/attendance")
async def save_attendance(payload: schemas.BulkAttendancePayload, db: Session = Depends(get_db)):
    if not payload.records:
        return {"message": "No records to save"}
    
    first = payload.records[0]
    
    # Clean up existing records for this class/date to strictly overwrite
    db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.classroom_id == first.classroom_id,
        models.AttendanceRecord.date == first.date
    ).delete()
    
    new_records = [
        models.AttendanceRecord(
            classroom_id=r.classroom_id,
            date=r.date,
            student_roll=r.student_roll,
            student_name=r.student_name,
            status=r.status,
            remarks=r.remarks # Now supports remarks properly
        ) for r in payload.records
    ]
    db.add_all(new_records)
    db.commit()
    return {"message": "Attendance saved successfully"}

# --- NEW: COMPLAINT ENDPOINTS ---
@app.post("/api/complaints", response_model=schemas.ComplaintResponse)
async def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    new_complaint = models.Complaint(
        name=complaint.name,
        email=complaint.email,
        subject=complaint.subject,
        message=complaint.message
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@app.get("/api/complaints", response_model=List[schemas.ComplaintResponse])
async def get_all_complaints(db: Session = Depends(get_db)):
    return db.query(models.Complaint).order_by(models.Complaint.created_at.desc()).all()

@app.post("/api/complaints/{complaint_id}/resolve")
async def resolve_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = "Resolved"
    db.commit()
    return {"message": "Complaint resolved"}

app.mount("/", StaticFiles(directory="public", html=True), name="public")
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    if request.url.path.startswith("/api/"): return JSONResponse(status_code=404, content={"detail": "Not Found"})
    return FileResponse('public/index.html')