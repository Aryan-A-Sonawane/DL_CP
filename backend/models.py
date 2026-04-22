"""SQLAlchemy ORM models for the Failure-to-Role Mapping Platform."""
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum


class RiskLevel(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    emp_code = Column(String(20), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(200))
    primary_domain = Column(String(100), nullable=False)
    department = Column(String(100))
    years_experience = Column(Float, default=0)
    soft_skill_score = Column(Float, default=5.0)  # 1-10
    created_at = Column(DateTime, default=datetime.utcnow)

    failure_events = relationship("FailureEvent", back_populates="employee", cascade="all, delete-orphan")
    strengths = relationship("Strength", back_populates="employee", cascade="all, delete-orphan")
    role_suggestions = relationship("RoleSuggestion", back_populates="employee", cascade="all, delete-orphan")


class FailureEvent(Base):
    __tablename__ = "failure_events"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    category = Column(String(80), nullable=False)          # e.g. "deadline_miss", "quality_issue"
    description = Column(Text)
    severity = Column(Float, default=5.0)                  # 1-10
    date = Column(DateTime, default=datetime.utcnow)
    recovery_time_days = Column(Integer, default=30)
    outcome_after = Column(String(60), default="neutral")  # improved / neutral / declined

    employee = relationship("Employee", back_populates="failure_events")


class Strength(Base):
    __tablename__ = "strengths"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String(100), nullable=False)
    score = Column(Float, default=5.0)      # 1-10
    source = Column(String(60), default="assessment")  # assessment / peer_review / manager

    employee = relationship("Employee", back_populates="strengths")


class RoleSuggestion(Base):
    __tablename__ = "role_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    suggested_role = Column(String(120), nullable=False)
    match_score = Column(Float, nullable=False)          # 0-100
    failure_score = Column(Float, default=0)
    resilience_index = Column(Float, default=0)
    leadership_score = Column(Float, default=0)
    growth_trajectory = Column(String(30), default="stable")
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="role_suggestions")
    audits = relationship("EthicalAudit", back_populates="suggestion", cascade="all, delete-orphan")


class EthicalAudit(Base):
    __tablename__ = "ethical_audits"

    id = Column(Integer, primary_key=True, index=True)
    suggestion_id = Column(Integer, ForeignKey("role_suggestions.id"), nullable=False)
    framework = Column(String(20), nullable=False)        # PASSIONIT / PRUTL
    dimension = Column(String(40), nullable=False)
    score = Column(Float, nullable=False)                  # 1-10
    risk_level = Column(String(10), nullable=False)        # Low / Medium / High
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    suggestion = relationship("RoleSuggestion", back_populates="audits")
