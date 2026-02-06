from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date, datetime

class CourseInput(BaseModel):
    name: str
    hours: int
    faculty: str

class GeneratePayload(BaseModel):
    courses: List[CourseInput]
    rooms: List[str]
    includeLunchBreak: bool

class ScheduleDetail(BaseModel):
    courseName: str
    facultyName: str
    roomName: str
    
class SaveSchedulePayload(BaseModel):
    sectionName: str
    schedule: Dict[str, Dict[str, Optional[ScheduleDetail]]]
    
class DeleteSchedulePayload(BaseModel):
    sectionName: str

class TeacherLeavePayload(BaseModel):
    teacher_name: str
    start_date: date
    end_date: date

class Solution(BaseModel):
    type: str
    details: str
    new_teacher_id: Optional[int] = None
    new_day: Optional[str] = None
    new_time_slot: Optional[str] = None
    new_room_id: Optional[int] = None

class Conflict(BaseModel):
    conflict_entry_id: int
    original_class: str
    solutions: List[Solution]

class AdjustmentSolutionPayload(BaseModel):
    solutions: List[Conflict]

class ApplySolutionPayload(BaseModel):
    entry_id_to_update: int
    solution: Solution

class DailyScheduleEntry(BaseModel):
    entry_id: int
    day: str
    time_slot: str
    course_name: str
    faculty_name: str
    room_name: str

class Announcement(BaseModel):
    id: str
    author: str
    date: str
    content: str

class AnnouncementCreate(BaseModel):
    content: str
    author: str

class StudentInput(BaseModel):
    name: str
    roll_no: str
    branch: str

class RoomDimension(BaseModel):
    name: str
    rows: int
    cols: int

class ExamSeatingPayload(BaseModel):
    students: List[StudentInput]
    rooms: List[RoomDimension]

class SeatAssignment(BaseModel):
    student: StudentInput
    room_name: str
    row: int
    col: int

class ExamSeatingResponse(BaseModel):
    assignments: List[SeatAssignment]
    unplaced: List[StudentInput]

class PostCreate(BaseModel):
    title: str
    content: str
    author: str
    role: str
    tag: str

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    author: str
    role: str
    tag: str
    attachment_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- NEW: COMPLAINT SCHEMAS ---
class ComplaintCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class ComplaintResponse(ComplaintCreate):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    classroom_id: str
    date: date
    student_roll: str
    student_name: str
    status: str
    remarks: Optional[str] = None

class AttendanceResponse(AttendanceCreate):
    id: int
    class Config:
        from_attributes = True

class BulkAttendancePayload(BaseModel):
    records: List[AttendanceCreate]