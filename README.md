# TutorBot 7082 Project

TutorBot is a full-stack study companion. Students can sign up, log in, configure learning preferences (visual aids, ADHD-friendly strategies, due-date reminders), and run AI-guided study sessions. The React frontend handles the experience, while the Node/Express backend orchestrates calls to Hugging Face, Gemini, and GPT-OSS models, stores user data in SQLite, and exposes REST APIs for auth, preferences, and AI prompts.

## Features
- AI-generated answers with secondary models fact-checking, critiquing, and refining responses
- User authentication plus per-user learning preference storage
- Session history persisted via SQLite
- React UI with onboarding, settings, and study prompt flows

## Prerequisites
- Node.js 18+
- npm
- Valid API keys stored in `Backend/.env` (`HF_TOKEN`, `GEMINI_API_KEY`, optional `OPENAI_API_KEY`)

## Setup & Run

### 1. Frontend
```powershell
cd .\frontend
npm install
npm run build 
```

Once the build is created move onto step 2.


### 2. Backend
```powershell
cd ..\Backend
npm install
node .\server.js
```

Once both services are running, open `http://localhost:3000` to use TutorBot.

## Frontend Linting
run locally
```powershell
npm run lint
```