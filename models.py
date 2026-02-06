from sqlalchemy import Column, Integer, String, Date, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Association Table
teacher_course_association = Table('teacher_course_association', Base.metadata,
    Column('teacher_id', Integer, ForeignKey('teachers.id'), primary_key=True),
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True)
)

class Teacher(Base):
    __tablename__ = 'teachers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    leaves = relationship("TeacherLeave", back_populates="teacher")
    courses = relationship("Course", secondary=teacher_course_association, back_populates="teachers")
    schedule_entries = relationship("ScheduleEntry", back_populates="teacher")

class Course(Base):
    __tablename__ = 'courses'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    teachers = relationship("Teacher", secondary=teacher_course_association, back_populates="courses")
    schedule_entries = relationship("ScheduleEntry", back_populates="course")

class Room(Base):
    __tablename__ = 'rooms'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    schedule_entries = relationship("ScheduleEntry", back_populates="room")

class Section(Base):
    __tablename__ = 'sections'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    schedule_entries = relationship("ScheduleEntry", back_populates="section")

class TeacherLeave(Base):
    __tablename__ = 'teacher_leaves'
    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=False)
    
    teacher = relationship("Teacher", back_populates="leaves")

class ScheduleEntry(Base):
    __tablename__ = 'schedule_entries'
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String(20), nullable=False)
    time_slot = Column(String(20), nullable=False)
    
    section_id = Column(Integer, ForeignKey('sections.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)

    section = relationship("Section", back_populates="schedule_entries")
    course = relationship("Course", back_populates="schedule_entries")
    teacher = relationship("Teacher", back_populates="schedule_entries")
    room = relationship("Room", back_populates="schedule_entries")
    overrides = relationship("ScheduleOverride", back_populates="original_entry", cascade="all, delete-orphan")

class ScheduleOverride(Base):
    __tablename__ = 'schedule_overrides'
    id = Column(Integer, primary_key=True, index=True)
    override_date = Column(Date, nullable=False)
    original_entry_id = Column(Integer, ForeignKey('schedule_entries.id'), nullable=False)
    change_type = Column(String, nullable=False)
    
    new_teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=True)
    new_room_id = Column(Integer, ForeignKey('rooms.id'), nullable=True)
    new_time_slot = Column(String, nullable=True)
    new_day = Column(String, nullable=True)
    
    original_entry = relationship("ScheduleEntry", back_populates="overrides")
    new_teacher = relationship("Teacher")
    new_room = relationship("Room")

class CommunityPost(Base):
    __tablename__ = 'community_posts'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    author = Column(String, nullable=False) 
    role = Column(String, nullable=False)    
    tag = Column(String, nullable=False)     
    attachment_url = Column(String, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)

class AttendanceRecord(Base):
    __tablename__ = 'attendance_log_v1' 
    
    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    student_roll = Column(String, nullable=False)
    student_name = Column(String, nullable=False)
    status = Column(String, nullable=False) 
    remarks = Column(String, nullable=True)

# --- NEW: COMPLAINT MODEL ---
class Complaint(Base):
    __tablename__ = 'complaints'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(String, nullable=False)
    status = Column(String, default="Pending") # Pending, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)