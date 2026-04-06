# AI Ticketing System 🎫

A smart internal helpdesk platform where AI reads incoming tickets, decides whether it can auto-resolve them, and if not, routes them to the correct department and employee.

**Live Demo:** https://ai-ticketing-system-ten.vercel.app
**Backend API:** https://ai-ticketing-system-d9bk.onrender.com/docs
**GitHub:** https://github.com/Shiva9966/ai-ticketing-system

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Recharts |
| Backend | FastAPI, SQLAlchemy, SQLite |
| AI | Groq (LLaMA 3.3 70B) + Ollama fallback |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Features

- AI analyzes every ticket — category, severity, sentiment, confidence score
- Auto-resolves FAQs, password resets, HR policy questions instantly
- Smart routing to correct department and best available employee
- Employee directory with skill tags, load tracking, availability status
- Full ticket lifecycle — New → Assigned → In Progress → Resolved → Closed
- Auto-escalation after 2 hours for Critical/High tickets
- Analytics dashboard with charts and AI success rate
- Groq + Ollama fallback chain
- Responsive design — mobile, tablet, desktop

---

## Tech Stack Details

**Backend**
- FastAPI
- SQLAlchemy + SQLite
- APScheduler (escalation job)
- Groq API (LLaMA 3.3 70B)
- Ollama (local fallback)

**Frontend**
- React 18 + Vite
- TailwindCSS
- Recharts
- React Router

---

## How to Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/Shiva9966/ai-ticketing-system
cd ai-ticketing-system
```

### 2. Backend setup
```bash
cd backend
pip install fastapi uvicorn sqlalchemy apscheduler python-dotenv groq
```

Create `.env` file inside `backend/` folder:
GROQ_API_KEY=your_groq_key_here

Run backend:
```bash
uvicorn main:app --reload
```

- Backend runs at `http://localhost:8000`
- API docs at `http://localhost:8000/docs`
- 12 employees across 6 departments are seeded automatically

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

- Frontend runs at `http://localhost:5173`

### 4. Ollama setup (optional — for local AI fallback)
```bash
ollama pull llama3.2
```

---

## AI Prompt Design

The system prompt specifies an exact JSON schema and all routing logic depends only on that structured output — never on free-form text. This makes routing deterministic and testable.

- **Output-as-contract**: JSON schema embedded in system prompt
- **Explicit routing rules**: Department mapping spelled out
- **Retry mechanism**: On JSON parse failure, retries once with stricter instruction
- **Safe fallback**: Returns default so ticket still gets created

---

## Modules

| Module | Description |
|--------|-------------|
| 1 — AI Analysis | Classifies every ticket instantly |
| 2 — Auto-resolution | Resolves FAQs without human intervention |
| 3 — Smart Routing | Routes to correct dept + best employee |
| 4 — Employee Directory | Skill + load + availability aware |
| 5 — Ticket Lifecycle | Full status management + escalation |
| 6 — Analytics | Live charts and KPIs |

---

## Known Limitations

- SQLite resets on Render free tier restarts
- Email notifications are simulated
- No authentication 