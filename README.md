# 🧠 AI Code Reviewer

An AI-powered code review platform that analyzes git diffs and provides **line-level security and quality feedback** in real-time through a VS Code–style interface.

---

## Features

* Diff-based code review (token-efficient)
* Real-time streaming feedback via WebSockets
* AI-powered analysis (Claude / OpenAI)
* Security + quality issue detection
* Inline comments like VS Code
* Severity classification (Low / Medium / High)
* Modular architecture (easy model/provider swapping)

---

## Tech Stack

### Backend

* FastAPI
* WebSockets (real-time streaming)
* Claude API / OpenAI API
* Python 3.10+

### Frontend

* React + TypeScript
* Monaco Editor (VS Code-like experience)
* Vite

### Infrastructure

* Docker + Docker Compose
* Nginx (optional reverse proxy)

---

## Project Structure

```
ai-code-reviewer/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── services/
│   │   ├── models/
│   │   ├── integrations/
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
│
├── infra/
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── .env.example
│
├── scripts/
├── .gitignore
├── LICENSE
└── README.md
```

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-code-reviewer.git
cd ai-code-reviewer
```

---

### 2. Configure Environment Variables

Create a `.env` file in the root or backend directory:

```env
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
```

---

### 3. Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at:
http://localhost:8000

---

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:
http://localhost:5173

---

## 🔌 API Reference

### POST `/review`

Submit a git diff for analysis.

#### Request

```json
{
  "diff": "your git diff here",
  "language": "python"
}
```

#### Response

```json
{
  "issues": [
    {
      "line": 42,
      "severity": "high",
      "type": "security",
      "message": "Potential SQL injection vulnerability"
    }
  ]
}
```

---

### WebSocket `/ws/review`

Streams AI-generated feedback in real time.

#### Behavior

* Client sends diff
* Server streams tokens/events
* UI updates incrementally

---

## How It Works

1. User pastes or uploads a git diff
2. Frontend sends diff to backend API
3. Backend:

   * Parses diff into structured format
   * Extracts changed lines only
   * Builds optimized prompt
   * Sends to AI model
4. AI response is streamed via WebSocket
5. Frontend renders:

   * Inline comments
   * Severity indicators
   * Review summary

---

## Core Concepts

### Diff-First Analysis

Only changed lines are analyzed → reduces cost and improves speed.

### Streaming UX

WebSockets enable token-by-token updates → faster perceived performance.

### Modular AI Layer

Easily switch between:

* Claude
* OpenAI
* Future local models (LLMs)

---

## Example Use Cases

* Pull Request automation
* Secure code scanning
* Developer productivity tools
* Coding interview platforms
* Educational code feedback systems

---

## Roadmap

* [ ] GitHub / GitLab integration
* [ ] Multi-file repository context
* [ ] Persistent review history
* [ ] Team collaboration (comments, threads)
* [ ] Custom rule engine
* [ ] Fine-tuned security models
* [ ] CI/CD integration

---

## Testing

```bash
cd backend
pytest
```

---

## Docker Setup (Optional)

```bash
docker-compose up --build
```

---

## Security Notice

This tool provides **AI-generated suggestions**.
It should not replace formal security reviews or static analysis tools.

---

## License

MIT License

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a pull request

---

## Inspiration

Built to replicate and extend modern AI-assisted development tools like:

* GitHub Copilot
* Cursor IDE
* CodeRabbit

---

## 👤 Author

Annafi Islam
GitHub: https://github.com/DevAnnafi
# AI_Code_Reviewer
