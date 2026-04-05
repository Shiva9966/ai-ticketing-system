from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    skill_tags = Column(JSON, default=[])
    avg_resolution_time = Column(Float, default=0.0)
    current_load = Column(Integer, default=0)
    availability_status = Column(String, default="Available")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    tickets = relationship("Ticket", back_populates="assignee")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    submitter_name = Column(String, nullable=False)
    submitter_email = Column(String, nullable=False)
    category = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    sentiment = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    resolution_path = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    estimated_hours = Column(Float, nullable=True)
    auto_response = Column(Text, nullable=True)
    assigned_department = Column(String, nullable=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    status = Column(String, default="New")
    internal_notes = Column(Text, nullable=True)
    is_escalated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    assignee = relationship("Employee", back_populates="tickets")
    audit_logs = relationship("AuditLog", back_populates="ticket")
    feedback = relationship("Feedback", back_populates="ticket", uselist=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    action = Column(String, nullable=False)
    actor = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    ticket = relationship("Ticket", back_populates="audit_logs")

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), unique=True, nullable=False)
    helpful = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ticket = relationship("Ticket", back_populates="feedback")