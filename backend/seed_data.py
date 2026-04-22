"""Seed data — 10 fake employees with realistic failure patterns."""
from datetime import datetime, timedelta
import random


def get_seed_employees():
    return [
        dict(emp_code="EMP001", name="Aarav Sharma", email="aarav@company.com",
             primary_domain="Software Engineering", department="Engineering",
             years_experience=5.0, soft_skill_score=6.8),
        dict(emp_code="EMP002", name="Priya Deshmukh", email="priya@company.com",
             primary_domain="Data Science", department="Analytics",
             years_experience=3.5, soft_skill_score=8.2),
        dict(emp_code="EMP003", name="Carlos Rivera", email="carlos@company.com",
             primary_domain="Project Management", department="Operations",
             years_experience=7.0, soft_skill_score=5.5),
        dict(emp_code="EMP004", name="Mei Zhang", email="mei@company.com",
             primary_domain="UX Design", department="Product",
             years_experience=4.0, soft_skill_score=7.9),
        dict(emp_code="EMP005", name="David Okonkwo", email="david@company.com",
             primary_domain="Quality Assurance", department="Engineering",
             years_experience=6.0, soft_skill_score=7.1),
        dict(emp_code="EMP006", name="Sara Jensen", email="sara@company.com",
             primary_domain="Marketing", department="Growth",
             years_experience=4.5, soft_skill_score=8.5),
        dict(emp_code="EMP007", name="Ravi Patel", email="ravi@company.com",
             primary_domain="Backend Engineering", department="Engineering",
             years_experience=8.0, soft_skill_score=5.0),
        dict(emp_code="EMP008", name="Emily Nakamura", email="emily@company.com",
             primary_domain="Sales", department="Revenue",
             years_experience=3.0, soft_skill_score=9.0),
        dict(emp_code="EMP009", name="Tomás García", email="tomas@company.com",
             primary_domain="DevOps", department="Infrastructure",
             years_experience=5.5, soft_skill_score=6.0),
        dict(emp_code="EMP010", name="Aisha Mohammed", email="aisha@company.com",
             primary_domain="Product Management", department="Product",
             years_experience=6.5, soft_skill_score=7.5),
    ]


def get_seed_failure_events():
    """Return list of (emp_index_1based, events_list)."""
    base = datetime(2024, 1, 15)
    return [
        (1, [
            dict(category="deadline_miss", description="Missed sprint deadlines 3 times due to scope creep handling",
                 severity=6.0, date=base, recovery_time_days=14, outcome_after="improved"),
            dict(category="communication", description="Failed to escalate blockers to stakeholders",
                 severity=5.0, date=base + timedelta(days=45), recovery_time_days=10, outcome_after="improved"),
            dict(category="quality_issue", description="Production bug due to insufficient testing",
                 severity=7.5, date=base + timedelta(days=120), recovery_time_days=21, outcome_after="neutral"),
        ]),
        (2, [
            dict(category="model_accuracy", description="ML model underperformed in production — 12% accuracy drop",
                 severity=8.0, date=base, recovery_time_days=30, outcome_after="improved"),
            dict(category="communication", description="Failed to set realistic expectations with business team",
                 severity=4.5, date=base + timedelta(days=60), recovery_time_days=7, outcome_after="improved"),
        ]),
        (3, [
            dict(category="team_conflict", description="Conflict with cross-functional team led to project stall",
                 severity=7.0, date=base, recovery_time_days=25, outcome_after="neutral"),
            dict(category="deadline_miss", description="Waterfall-style planning caused 2-month delay",
                 severity=8.5, date=base + timedelta(days=90), recovery_time_days=45, outcome_after="declined"),
            dict(category="budget_overrun", description="Project exceeded budget by 35%",
                 severity=7.5, date=base + timedelta(days=180), recovery_time_days=30, outcome_after="improved"),
        ]),
        (4, [
            dict(category="stakeholder_rejection", description="Design rejected by client 3 times",
                 severity=6.0, date=base, recovery_time_days=15, outcome_after="improved"),
            dict(category="deadline_miss", description="Redesign cycle exceeded timeline",
                 severity=5.5, date=base + timedelta(days=40), recovery_time_days=10, outcome_after="improved"),
        ]),
        (5, [
            dict(category="quality_issue", description="Missed critical regression bugs in release",
                 severity=9.0, date=base, recovery_time_days=35, outcome_after="neutral"),
            dict(category="process_failure", description="Test automation framework broke during migration",
                 severity=6.5, date=base + timedelta(days=75), recovery_time_days=20, outcome_after="improved"),
            dict(category="communication", description="Failed to document test coverage gaps",
                 severity=4.0, date=base + timedelta(days=130), recovery_time_days=7, outcome_after="improved"),
        ]),
        (6, [
            dict(category="campaign_failure", description="Campaign ROI was 60% below target",
                 severity=7.0, date=base, recovery_time_days=20, outcome_after="improved"),
            dict(category="data_misinterpretation", description="Misread analytics leading to wrong audience targeting",
                 severity=6.5, date=base + timedelta(days=55), recovery_time_days=14, outcome_after="improved"),
        ]),
        (7, [
            dict(category="system_outage", description="Deployed code caused 4-hour production outage",
                 severity=9.5, date=base, recovery_time_days=3, outcome_after="improved"),
            dict(category="team_conflict", description="Refused code reviews from junior developers",
                 severity=5.0, date=base + timedelta(days=30), recovery_time_days=60, outcome_after="neutral"),
            dict(category="deadline_miss", description="Overengineered solution delayed feature by 3 weeks",
                 severity=6.0, date=base + timedelta(days=100), recovery_time_days=14, outcome_after="improved"),
            dict(category="communication", description="Poor documentation of architecture decisions",
                 severity=4.5, date=base + timedelta(days=160), recovery_time_days=10, outcome_after="improved"),
        ]),
        (8, [
            dict(category="target_miss", description="Missed quarterly sales target by 40%",
                 severity=8.0, date=base, recovery_time_days=30, outcome_after="neutral"),
            dict(category="client_loss", description="Lost key account due to over-promising",
                 severity=8.5, date=base + timedelta(days=90), recovery_time_days=45, outcome_after="declined"),
        ]),
        (9, [
            dict(category="system_outage", description="Infrastructure misconfiguration caused data loss scare",
                 severity=9.0, date=base, recovery_time_days=5, outcome_after="improved"),
            dict(category="process_failure", description="CI/CD pipeline broke blocking all deployments for 2 days",
                 severity=7.0, date=base + timedelta(days=50), recovery_time_days=3, outcome_after="improved"),
        ]),
        (10, [
            dict(category="stakeholder_rejection", description="Product roadmap rejected by leadership twice",
                 severity=7.0, date=base, recovery_time_days=20, outcome_after="improved"),
            dict(category="team_conflict", description="Poor delegation led to team burnout",
                 severity=6.5, date=base + timedelta(days=70), recovery_time_days=30, outcome_after="improved"),
            dict(category="deadline_miss", description="Feature launch delayed due to shifting priorities",
                 severity=5.0, date=base + timedelta(days=140), recovery_time_days=15, outcome_after="improved"),
        ]),
    ]


def get_seed_strengths():
    """Return list of (emp_index_1based, strengths_list)."""
    return [
        (1, [
            dict(name="Problem Solving", score=8.5, source="assessment"),
            dict(name="System Thinking", score=7.0, source="manager"),
            dict(name="Adaptability", score=7.8, source="peer_review"),
        ]),
        (2, [
            dict(name="Analytical Thinking", score=9.0, source="assessment"),
            dict(name="Storytelling with Data", score=8.0, source="manager"),
            dict(name="Curiosity", score=8.5, source="peer_review"),
        ]),
        (3, [
            dict(name="Strategic Vision", score=7.5, source="manager"),
            dict(name="Stakeholder Management", score=6.0, source="assessment"),
            dict(name="Risk Assessment", score=7.0, source="peer_review"),
        ]),
        (4, [
            dict(name="Creativity", score=9.0, source="assessment"),
            dict(name="User Empathy", score=8.5, source="peer_review"),
            dict(name="Visual Communication", score=8.0, source="manager"),
        ]),
        (5, [
            dict(name="Attention to Detail", score=8.0, source="assessment"),
            dict(name="Process Improvement", score=7.5, source="manager"),
            dict(name="Systematic Thinking", score=7.0, source="peer_review"),
        ]),
        (6, [
            dict(name="Creativity", score=8.5, source="assessment"),
            dict(name="Persuasion", score=8.0, source="manager"),
            dict(name="Trend Analysis", score=7.5, source="peer_review"),
        ]),
        (7, [
            dict(name="Deep Technical Knowledge", score=9.5, source="assessment"),
            dict(name="Problem Solving", score=8.5, source="manager"),
            dict(name="Architecture Design", score=9.0, source="peer_review"),
        ]),
        (8, [
            dict(name="Empathy", score=9.0, source="assessment"),
            dict(name="Relationship Building", score=8.5, source="peer_review"),
            dict(name="Active Listening", score=8.0, source="manager"),
        ]),
        (9, [
            dict(name="Crisis Management", score=8.5, source="assessment"),
            dict(name="Automation Mindset", score=9.0, source="manager"),
            dict(name="Quick Recovery", score=8.0, source="peer_review"),
        ]),
        (10, [
            dict(name="Visionary Thinking", score=8.0, source="assessment"),
            dict(name="Cross-functional Leadership", score=7.5, source="manager"),
            dict(name="Empathy", score=8.5, source="peer_review"),
        ]),
    ]
