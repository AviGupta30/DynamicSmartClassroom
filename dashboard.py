from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from database import get_db

router = APIRouter()

# This dictionary can be placed at the top of your dashboard.py file
static_dashboard_data = {
    "teacherName": "Prof. Evelyn (Sample)",
    "totalCourses": 5,
    "totalStudents": 180,
    "classSchedule": [
        {
            "course": "Linear Algebra", "section": "CS-A", "day": "Monday",
            "time": "11:00 AM - 12:00 PM", "faculty": "Prof. Evelyn", "room": "C204",
            "startHour": 11, "durationHours": 1
        },
        {
            "course": "Mobile Dev Lab", "section": "CS-B", "day": "Monday",
            "time": "2:00 PM - 4:00 PM", "faculty": "Prof. Evelyn", "room": "Lab 4A",
            "startHour": 14, "durationHours": 2
        },
        {
            "course": "Discrete Mathematics", "section": "CS-B", "day": "Tuesday",
            "time": "10:00 AM - 11:00 AM", "faculty": "Prof. Evelyn", "room": "A201",
            "startHour": 10, "durationHours": 1
        },
        {
            "course": "Calculus II", "section": "MATH-B", "day": "Wednesday",
            "time": "9:00 AM - 11:00 AM", "faculty": "Prof. Evelyn", "room": "C204",
            "startHour": 9, "durationHours": 2
        },
        {
            "course": "Linear Algebra", "section": "CS-A", "day": "Thursday",
            "time": "9:00 AM - 10:00 AM", "faculty": "Prof. Evelyn", "room": "C204",
            "startHour": 9, "durationHours": 1
        },
        {
            "course": "Data Structures", "section": "CS-A", "day": "Friday",
            "time": "10:00 AM - 11:00 AM", "faculty": "Prof. Evelyn", "room": "A101",
            "startHour": 10, "durationHours": 1
        }
    ],
    "facultyOnLeave": [
        {"name": "Dr. Brown", "avatar": "https://i.pravatar.cc/32?img=12"},
        {"name": "Prof. Johnson", "avatar": "https://i.pravatar.cc/32?img=5"}
    ],
    "weather": {
        "forecast": [
            {
                "day": "Today", "icon": "🌧️", "condition": "Heavy Rain",
                "recommendation": "Online Classes Recommended", "onlineClassProbability": "90-95%"
            },
            {
                "day": "Tomorrow", "icon": "☀️", "condition": "Sunny Skies",
                "recommendation": "Offline Classes as Scheduled", "onlineClassProbability": "<5%"
            }
        ]
    }
}

# --- Static Data for Fallback ---
static_dashboard_data = {
    "teacherName": "Prof. Evelyn (Sample)", "totalCourses": 6, "totalStudents": 180,
    "classSchedule": [
        {"course": "Linear Algebra", "section": "CS-A", "day": "Monday", "time": "11:00 AM - 12:00 PM", "faculty": "Prof. Evelyn", "room": "C204", "startHour": 11, "durationHours": 1},
        {"course": "Mobile Development", "section": "CS-B", "day": "Monday", "time": "2:00 PM - 3:00 PM", "faculty": "Prof. Evelyn", "room": "Lab 4", "startHour": 14, "durationHours": 1},
        {"course": "Discrete Mathematics", "section": "CS-B", "day": "Tuesday", "time": "10:00 AM - 11:00 AM", "faculty": "Prof. Evelyn", "room": "A201", "startHour": 10, "durationHours": 1},
        {"course": "Calculus II", "section": "MATH-B", "day": "Wednesday", "time": "9:00 AM - 10:00 AM", "faculty": "Prof. Evelyn", "room": "C204", "startHour": 9, "durationHours": 1},
        {"course": "Data Structures", "section": "CS-A", "day": "Friday", "time": "10:00 AM - 11:00 AM", "faculty": "Prof. Evelyn", "room": "A101", "startHour": 10, "durationHours": 1}
    ],
    "facultyOnLeave": [{"name": "Dr. Brown", "avatar": "https://i.pravatar.cc/32?img=12"}, {"name": "Prof. Johnson", "avatar": "https://i.pravatar.cc/32?img=5"}],
    "weather": { "forecast": [{"day": "Today", "icon": "🌧️", "condition": "Heavy Rain", "recommendation": "Online Classes Recommended", "onlineClassProbability": "90-95%"}, {"day": "Tomorrow", "icon": "☀️", "condition": "Sunny Skies", "recommendation": "Offline Classes as Scheduled", "onlineClassProbability": "<5%"}]}
}

teacher_classrooms_data = [
    {"id": "cs-a-la", "name": "Linear Algebra - CS-A", "subject": "Mathematics"},
    {"id": "cs-b-md", "name": "Mobile Development - CS-B", "subject": "Computer Science"},
]

# MODIFIED: This function is now more resilient and will not crash.
@router.get("/api/dashboard")
async def get_dashboard_data(db: Session = Depends(get_db)):
    try:
        teacher_name = "Prof. Evelyn"
        
        # Step 1: Try to get live data from the database
        schedule_entries = db.query(models.ScheduleEntry).filter(models.ScheduleEntry.faculty_name == teacher_name).all()
        
        # Step 2: If live data exists, process it and return it
        if schedule_entries:
            class_schedule = []
            for entry in schedule_entries:
                start_hour = int(entry.time_slot.split(':')[0]) if ':' in entry.time_slot else 9
                class_schedule.append({
                    "course": entry.course_name, "section": entry.section_name, "day": entry.day,
                    "time": f"{entry.time_slot} - {start_hour+1}:00 {'AM' if start_hour+1 < 12 else 'PM'}",
                    "faculty": entry.faculty_name, "room": entry.room_name, "startHour": start_hour, "durationHours": 1
                })
            
            total_courses = db.query(func.count(func.distinct(models.ScheduleEntry.course_name))).filter(models.ScheduleEntry.faculty_name == teacher_name).scalar() or 0
            
            # Return the dynamically generated dashboard data
            return {
                "teacherName": teacher_name, 
                "totalCourses": total_courses, 
                "totalStudents": 180, 
                "classSchedule": class_schedule, 
                "facultyOnLeave": static_dashboard_data["facultyOnLeave"], 
                "weather": static_dashboard_data["weather"]
            }

    except Exception as e:
        # Step 3 (Error Fallback): If ANY error occurs while accessing the database,
        # print a warning to the server console and return the static sample data.
        print(f"WARNING: Could not fetch dynamic dashboard data due to an error: {e}. Falling back to static data.")
        return static_dashboard_data

    # Step 4 (Empty Fallback): If the database query was successful but found no entries,
    # return the static sample data.
    return static_dashboard_data


@router.get("/api/classrooms")
async def get_classrooms_data():
    return teacher_classrooms_data