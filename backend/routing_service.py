from sqlalchemy.orm import Session
from models import Employee, AuditLog
from datetime import datetime

def suggest_assignee(department: str, category: str, db: Session):
    employees = db.query(Employee).filter(
        Employee.department == department,
        Employee.availability_status != "On Leave",
        Employee.is_active == True
    ).all()

    if not employees:
        return None

    def score(emp):
        skill_match = any(category.lower() in tag.lower() for tag in (emp.skill_tags or []))
        load_score = max(0, 10 - emp.current_load)
        avail_score = 2 if emp.availability_status == "Available" else 1
        return (skill_match * 5) + load_score + avail_score

    return max(employees, key=score)

def log_action(ticket_id: int, action: str, actor: str, note: str,
               old_value: str = None, new_value: str = None, db: Session = None):
    log = AuditLog(
        ticket_id=ticket_id,
        action=action,
        actor=actor,
        note=note,
        old_value=old_value,
        new_value=new_value
    )
    db.add(log)
    db.commit()