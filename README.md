Absolutely — here’s a **short, clean `README.md`** you can copy directly:

````markdown
# 🎙️ INDICVOICE AI

> An oral-first AI agent designed to understand natural Indian speech and connect users to digital services.

## 🚀 Overview

INDICVOICE AI lets users interact naturally through voice instead of typing structured queries. It supports conversational, multilingual and code-switched input and converts it into actionable search requests.

**Example:**

> "Chennai se Bangalore jaana hai, subah mein koi cheap train hai kya?"

→ Detects travel intent → extracts locations, time and preference → searches → ranks results → responds to the user.

## ✨ Features

- 🎤 Voice-first interaction
- 🇮🇳 Indian language & Hinglish friendly
- 🧠 Intent and parameter extraction
- 🚆 Travel search
- 🛍️ Product search
- 🌐 Web search
- 🔎 Result ranking
- 🔊 Text-to-Speech responses
- ⚡ FastAPI backend + React frontend

## 🛠️ Tech Stack

**Backend:** Python, FastAPI, Uvicorn  
**Frontend:** React, Vite, JavaScript, CSS  
**Voice:** Sarvam AI (Speech-to-Text & Text-to-Speech)  
**Deployment:** Render

## 📁 Structure

```text
INDICVOICE-AI/
├── backend/
│   ├── api/
│   ├── services/
│   ├── tools/
│   ├── main.py
│   └── speech.py
├── frontend/
│   └── src/
├── requirements.txt
└── README.md
````

## ⚙️ Run Locally

### Backend

```bash
git clone https://github.com/binduhasini11/INDICVOICE-AI.git
cd INDICVOICE-AI

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file:

```env
SARVAM_API_KEY=your_api_key
TAVILY_API_KEY=your_api_key
```

Run:

```bash
python -m uvicorn backend.main:app --reload
```

Backend: `http://127.0.0.1:8000`

API Docs: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🧠 Architecture

```text
User Voice
    ↓
Speech-to-Text
    ↓
Intent Detection
    ↓
Search Service
    ↓
Result Ranking
    ↓
Response
    ↓
Text-to-Speech
```

## 🔮 Future Scope

* More Indian language support
* Better multilingual/code-switched understanding
* Real-time travel availability
* Voice-based booking
* More digital-service integrations
* Improved multi-turn conversations

## 👥 Team

Built collaboratively by team **TECHTONIC**.

## 🔗 Repository

[https://github.com/binduhasini11/INDICVOICE-AI](https://github.com/binduhasini11/INDICVOICE-AI)

```

**This version is much better for your hackathon repo** — short enough to read quickly, but still shows the architecture, tech stack, setup, and progress.
```
