# AI Interview Copilot

A full-stack MERN AI Interview Practice Platform with JWT authentication, OTP email verification, dynamic Groq-powered question generation, and detailed interview analytics.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or Atlas URI

---

### Backend Setup

```bash
cd backend
npm install
# Configure your .env file (see backend/.env)
npm run dev
# Runs at http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## 🔑 Configuration (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/interview-copilot

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# SMTP (optional — OTP prints to console if unconfigured)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_user
EMAIL_PASS=your_pass
EMAIL_FROM=noreply@interviewcopilot.ai

# Groq API Key (required for domain-specific interview questions)
GROQ_API_KEY=your_groq_key_here
# Optional model override (default: llama-3.3-70b-versatile)
# GROQ_MODEL=llama-3.3-70b-versatile
```

> OTP codes print to the backend terminal if SMTP is unconfigured.

---

## 📐 Architecture

```
AI_COPILOT/
├── backend/
│   ├── config/db.js             # Mongoose connection
│   ├── middleware/auth.js       # JWT + Role guards
│   ├── models/User.js           # User schema
│   ├── models/Interview.js      # Interview session schema
│   ├── routes/auth.js           # Register, Login, OTP, Refresh, Logout
│   ├── routes/interview.js      # Start, Answer, Report, Stats, History
│   ├── services/emailService.js # Nodemailer + console fallback
│   ├── services/groqService.js  # Groq LLM (questions, scoring, feedback)
│   └── server.js                # Express entry point
└── frontend/
    ├── src/
    │   ├── contexts/AuthContext.jsx  # Auth state + token management
    │   ├── components/Navbar.jsx     # Navbar with user session
    │   ├── components/GlowAvatar.jsx # Animated AI avatar
    │   ├── pages/LandingPage.jsx     # Marketing landing page
    │   ├── pages/AuthPage.jsx        # Login / Register / OTP verify
    │   ├── pages/DashboardPage.jsx   # Subject selector + Resume upload
    │   ├── pages/InterviewPage.jsx   # Real-time interview room
    │   ├── pages/FeedbackReportPage.jsx # Scorecard + Q&A audit
    │   └── pages/ProfilePage.jsx    # Analytics + SVG Radar/Line charts
    └── src/index.css               # Full design system
```

## 🧠 Features

| Feature | Description |
|---|---|
| JWT Auth | 15-min access tokens + 3-day HTTP-only refresh cookies |
| OTP Verification | Email (or console in dev mode) with resend + rate limiting |
| Password Reset | Forgot password via OTP → change password page |
| Role-Based Access | Candidate & Admin roles |
| AI Interviews | Adaptive follow-up questions via Groq |
| Resume Parsing | PDF upload → Groq resume-aware questions |
| Speech-to-Text | Web Speech API for voice dictation |
| Feedback Reports | Per-question grades + overall scorecard |
| Skill Analytics | SVG Radar chart + Line trend graph |
