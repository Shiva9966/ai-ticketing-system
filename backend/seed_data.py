from database import SessionLocal, engine
from models import Base, Employee

EMPLOYEES = [
    {"name": "Arjun Mehta", "email": "arjun@company.com", "department": "Engineering",
     "designation": "Senior Backend Engineer", "skill_tags": ["DB", "Bug", "Server", "Python"]},
    {"name": "Priya Sharma", "email": "priya@company.com", "department": "Engineering",
     "designation": "Full Stack Engineer", "skill_tags": ["Bug", "Feature", "React"]},
    {"name": "Rahul Nair", "email": "rahul@company.com", "department": "DevOps",
     "designation": "DevOps Lead", "skill_tags": ["Server", "DB", "Networking", "AWS"]},
    {"name": "Sneha Iyer", "email": "sneha@company.com", "department": "DevOps",
     "designation": "SRE", "skill_tags": ["Server", "Monitoring", "Linux"]},
    {"name": "Karan Patel", "email": "karan@company.com", "department": "IT",
     "designation": "IT Support Specialist", "skill_tags": ["Access", "Networking", "VPN"]},
    {"name": "Divya Reddy", "email": "divya@company.com", "department": "IT",
     "designation": "Systems Administrator", "skill_tags": ["Access", "Security"]},
    {"name": "Meera Joshi", "email": "meera@company.com", "department": "HR",
     "designation": "HR Manager", "skill_tags": ["HR", "Payroll", "Leave Policy"]},
    {"name": "Amit Verma", "email": "amit@company.com", "department": "HR",
     "designation": "HR Specialist", "skill_tags": ["HR", "Onboarding", "Benefits"]},
    {"name": "Lakshmi Rao", "email": "lakshmi@company.com", "department": "Finance",
     "designation": "Finance Manager", "skill_tags": ["Billing", "Payroll", "Reimbursement"]},
    {"name": "Vikram Singh", "email": "vikram@company.com", "department": "Finance",
     "designation": "Accounts Executive", "skill_tags": ["Billing", "Tax"]},
    {"name": "Nisha Kapoor", "email": "nisha@company.com", "department": "Product",
     "designation": "Product Manager", "skill_tags": ["Feature", "Bug", "Roadmap"]},
    {"name": "Rohan Desai", "email": "rohan@company.com", "department": "Product",
     "designation": "Product Analyst", "skill_tags": ["Feature", "Analytics"]},
]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(Employee).count() > 0:
        print("Already seeded.")
        db.close()
        return
    for emp in EMPLOYEES:
        db.add(Employee(**emp))
    db.commit()
    print(f"Seeded {len(EMPLOYEES)} employees.")
    db.close()

if __name__ == "__main__":
    seed()