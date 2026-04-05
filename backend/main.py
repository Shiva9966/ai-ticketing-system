from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
from apscheduler.schedulers.background import BackgroundScheduler

from database import engine, get_db, SessionLocal
from models import Base, Ticket, Employee, Feedback
from ai_service import analyze_ticket
from routing_service import suggest_assignee, log_action
from seed_data import seed

app = FastAPI(title="AI Ticketing System")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-ticketing-system-ten.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ── Pydantic schemas ──────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    title: str
    description: str
    submitter_name: str
    submitter_email: str

class TicketStatusUpdate(BaseModel):
    status: str
    internal_notes: Optional[str] = None
    actor: str = "Agent"

class EmployeeCreate(BaseModel):
    name: str
    email: str
    department: str
    designation: str
    skill_tags: List[str] = []
    availability_status: str = "Available"

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    skill_tags: Optional[List[str]] = None
    availability_status: Optional[str] = None
    is_active: Optional[bool] = None

class FeedbackCreate(BaseModel):
    helpful: bool


# ── Escalation job ────────────────────────────────────────────────────────────

def check_escalations():
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(hours=2)  # change to hours=2 for production

        stale = db.query(Ticket).filter(
            Ticket.status.in_(["New", "Assigned"]),
            Ticket.severity.in_(["Critical", "High"]),
            Ticket.updated_at <= cutoff,
            Ticket.is_escalated == False
        ).all()

        for ticket in stale:
            ticket.is_escalated = True
            ticket.severity = "Critical"

            if ticket.assigned_department:
                new_assignee = suggest_assignee(
                    ticket.assigned_department,
                    ticket.category or "Other",
                    db
                )
                if new_assignee and new_assignee.id != ticket.assigned_employee_id:
                    if ticket.assignee:
                        ticket.assignee.current_load = max(0, ticket.assignee.current_load - 1)
                    ticket.assigned_employee_id = new_assignee.id
                    ticket.status = "Assigned"
                    new_assignee.current_load += 1
                    log_action(ticket.id, "escalated", "Escalation System",
                               f"Auto-escalated and reassigned to {new_assignee.name} after 2 hours",
                               db=db)
                else:
                    log_action(ticket.id, "escalated", "Escalation System",
                               "Auto-escalated after 2 hours without resolution",
                               db=db)

        db.commit()
        if stale:
            print(f"[Escalation] Processed {len(stale)} tickets")

    except Exception as e:
        print(f"[Escalation] Error: {e}")
    finally:
        db.close()


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed()
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_escalations, "interval", minutes=15, id="escalation")  # change to 15 for production
    scheduler.start()
    print("[Scheduler] Escalation job started")


# ── Ticket routes ─────────────────────────────────────────────────────────────

@app.post("/tickets/")
def create_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)):
    ai = analyze_ticket(ticket_in.title, ticket_in.description)

    severity = ai.get("severity", "Medium")
    if ai.get("category") in ("DB", "Server"):
        severity = "Critical"
    elif ai.get("category") == "Access" and severity == "Low":
        severity = "High"

    ticket = Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        submitter_name=ticket_in.submitter_name,
        submitter_email=ticket_in.submitter_email,
        category=ai.get("category"),
        severity=severity,
        sentiment=ai.get("sentiment"),
        ai_summary=ai.get("summary"),
        resolution_path=ai.get("resolution_path"),
        confidence_score=ai.get("confidence"),
        estimated_hours=ai.get("estimated_hours"),
        auto_response=ai.get("auto_response"),
        assigned_department=ai.get("department"),
        status="New"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    log_action(ticket.id, "ai_analyzed", "AI System",
               f"Classified as {ticket.category} | {ticket.severity} | confidence {ticket.confidence_score:.0%}",
               db=db)

    if ai.get("resolution_path") == "auto_resolve":
        ticket.status = "Resolved"
        ticket.resolved_at = datetime.utcnow()
        db.commit()
        log_action(ticket.id, "auto_resolved", "AI System", "Ticket auto-resolved", db=db)
    else:
        dept = ai.get("department")
        if dept:
            assignee = suggest_assignee(dept, ai.get("category", "Other"), db)
            if assignee:
                ticket.assigned_employee_id = assignee.id
                ticket.status = "Assigned"
                ticket.updated_at = datetime.utcnow()
                assignee.current_load += 1
                db.commit()
                log_action(ticket.id, "assigned", "AI System",
                           f"Assigned to {assignee.name} ({dept})",
                           new_value=str(assignee.id), db=db)

    db.refresh(ticket)
    return ticket


@app.get("/tickets/")
def list_tickets(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Ticket)
    if status:   q = q.filter(Ticket.status == status)
    if severity: q = q.filter(Ticket.severity == severity)
    if category: q = q.filter(Ticket.category == category)
    if search:   q = q.filter(Ticket.title.ilike(f"%{search}%"))
    return q.order_by(Ticket.created_at.desc()).all()


@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    _ = ticket.assignee
    _ = ticket.feedback
    return ticket


@app.patch("/tickets/{ticket_id}/status")
def update_status(ticket_id: int, update: TicketStatusUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    ticket.status = update.status
    ticket.updated_at = datetime.utcnow()
    if update.internal_notes:
        ticket.internal_notes = update.internal_notes
    if update.status in ("Resolved", "Closed"):
        ticket.resolved_at = datetime.utcnow()
        if ticket.assignee:
            ticket.assignee.current_load = max(0, ticket.assignee.current_load - 1)

    db.commit()
    log_action(ticket_id, "status_change", update.actor,
               f"Status changed to {update.status}",
               old_value=old_status, new_value=update.status, db=db)
    db.refresh(ticket)
    return ticket


@app.patch("/tickets/{ticket_id}/assign/{employee_id}")
def assign_ticket(ticket_id: int, employee_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not ticket or not employee:
        raise HTTPException(status_code=404, detail="Not found")

    if ticket.assignee:
        ticket.assignee.current_load = max(0, ticket.assignee.current_load - 1)

    ticket.assigned_employee_id = employee_id
    ticket.status = "Assigned"
    ticket.updated_at = datetime.utcnow()
    employee.current_load += 1
    db.commit()
    log_action(ticket_id, "assigned", "Admin",
               f"Manually assigned to {employee.name}", db=db)
    db.refresh(ticket)
    return ticket


@app.post("/tickets/{ticket_id}/feedback")
def submit_feedback(ticket_id: int, fb: FeedbackCreate, db: Session = Depends(get_db)):
    existing = db.query(Feedback).filter(Feedback.ticket_id == ticket_id).first()
    if existing:
        existing.helpful = fb.helpful
        db.commit()
        return existing
    feedback = Feedback(ticket_id=ticket_id, helpful=fb.helpful)
    db.add(feedback)
    db.commit()
    return feedback


@app.get("/tickets/{ticket_id}/logs")
def get_ticket_logs(ticket_id: int, db: Session = Depends(get_db)):
    from models import AuditLog
    return db.query(AuditLog).filter(AuditLog.ticket_id == ticket_id).order_by(AuditLog.created_at).all()


# ── Employee routes ───────────────────────────────────────────────────────────

@app.post("/employees/")
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.email == emp.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    employee = Employee(**emp.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@app.get("/employees/")
def list_employees(department: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Employee).filter(Employee.is_active == True)
    if department:
        q = q.filter(Employee.department == department)
    return q.order_by(Employee.department, Employee.name).all()


@app.patch("/employees/{employee_id}")
def update_employee(employee_id: int, update: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(emp, field, value)
    db.commit()
    db.refresh(emp)
    return emp


@app.delete("/employees/{employee_id}")
def deactivate_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = False
    db.commit()
    return emp


# ── Analytics route ───────────────────────────────────────────────────────────

@app.get("/analytics/")
def get_analytics(db: Session = Depends(get_db)):
    from collections import Counter

    all_tickets = db.query(Ticket).all()
    total = len(all_tickets)
    open_t = sum(1 for t in all_tickets if t.status not in ("Resolved", "Closed"))
    resolved = sum(1 for t in all_tickets if t.status in ("Resolved", "Closed"))
    auto_resolved = sum(1 for t in all_tickets if t.resolution_path == "auto_resolve")
    escalated = sum(1 for t in all_tickets if t.is_escalated)

    auto_tickets = [t for t in all_tickets if t.resolution_path == "auto_resolve"]
    helpful = sum(1 for t in auto_tickets if t.feedback and t.feedback.helpful)
    success_rate = round(helpful / len(auto_tickets) * 100, 1) if auto_tickets else 0.0

    dept_load = {}
    for t in all_tickets:
        if t.assigned_department and t.status not in ("Resolved", "Closed"):
            dept_load[t.assigned_department] = dept_load.get(t.assigned_department, 0) + 1

    week_ago = datetime.utcnow() - timedelta(days=7)
    week_cats = Counter(t.category for t in all_tickets if t.category and t.created_at >= week_ago)
    top_categories = [{"category": c, "count": n} for c, n in week_cats.most_common(5)]

    return {
        "total_tickets": total,
        "open_tickets": open_t,
        "resolved_tickets": resolved,
        "auto_resolved_tickets": auto_resolved,
        "escalated_tickets": escalated,
        "auto_resolution_success_rate": success_rate,
        "department_load": dept_load,
        "top_categories": top_categories,
        "tickets_by_status": dict(Counter(t.status for t in all_tickets)),
        "tickets_by_severity": dict(Counter(t.severity for t in all_tickets if t.severity)),
    }