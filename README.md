# Assessment Platform (MVP)

Minimal va zamonaviy assessment platformasi. Yangi o'quvchilarni tezda baholash uchun yaratilgan.

## Features

- **Landing page**: Hero section, CTA buttons, 3-step process.
- **Test selection**: Search/filter, difficulty badges, cards.
- **Student intake form**: Name + age validation.
- **Quiz engine**: Progress bar, timer, localStorage persistence, beforeunload protection.
- **Result page**: Score, percent, level, feedback.
- **Admin panel**: View all results, search by test name.
- **Telegram integration**: Automatic result notifications.

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Server-side JSON** for data (tests.json, results.json)
- **Telegram Bot API**

## Project Structure

```
lms/
├── app/
│   ├── layout.tsx              # Root layout with header
│   ├── page.tsx                # Landing page (hero + steps)
│   ├── tests/
│   │   ├── page.tsx
│   │   └── TestsList.tsx       # Test list with search
│   ├── start/[testId]/
│   │   ├── page.tsx
│   │   └── StartClient.tsx     # Student info form
│   ├── quiz/[testId]/
│   │   ├── page.tsx
│   │   └── QuizClient.tsx      # Quiz engine (timer, progress, persist)
│   ├── result/[attemptId]/
│   │   ├── page.tsx
│   │   └── ResultClient.tsx    # Result display
│   ├── admin/
│   │   └── results/
│   │       └── page.tsx        # Admin panel table
│   ├── api/
│   │   ├── submit/route.ts     # POST: save result + telegram
│   │   └── results/route.ts    # GET: read results
├── data/
│   ├── tests.json              # Test questions
│   └── results.json            # Result records (append-only)
├── lib/
│   ├── types.ts                # TypeScript types
│   ├── data.ts                 # Server-side data helpers
│   ├── score.ts                # Level calculation (0-40/41-70/71-100)
│   └── storage.ts              # localStorage keys
├── .env.example                # Environment variables template
├── package.json
└── README.md
```

## Setup & Run

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:

   Copy `.env.example` to `.env.local` and fill in:

   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

3. **Run dev server**:

   ```bash
   npm run dev
   ```

4. **Open**: <http://localhost:3000>

## Data Format

### tests.json

```json
[
  {
    "id": "python-basic-1",
    "title": "Python Basic - Kirish testi",
    "difficulty": "Beginner",
    "timeLimitSec": 600,
    "questions": [
      {
        "id": "q1",
        "question": "Python'da print nima qiladi?",
        "options": ["Kiritadi", "Chop etadi", "O'chiradi", "Saqlaydi"],
        "answerIndex": 1
      }
    ]
  }
]
```

### results.json

```json
[
  {
    "attemptId": "uuid",
    "createdAt": "ISO string",
    "student": { "name": "Ali", "age": 14 },
    "test": { "id": "...", "title": "..." },
    "score": { "correct": 7, "total": 10, "percent": 70 },
    "level": "Intermediate",
    "answers": [
      { "questionId": "q1", "selectedIndex": 1, "isCorrect": true }
    ]
  }
]
```

## Key Decisions

1. **No database (MVP)**: All data in JSON files (`data/tests.json`, `data/results.json`).
2. **localStorage**: Student info, quiz progress, answers, attemptId, submitted attempts.
3. **Idempotent submit**: `attemptId` ensures one-time submission (duplicates ignored).
4. **Timer auto-finish**: If `timeLimitSec` is set, quiz auto-submits when time runs out.
5. **beforeunload**: Browser-level confirmation to prevent accidental exit (where supported).
6. **Telegram integration**: Results sent via Bot API (POST to `https://api.telegram.org/bot<token>/sendMessage`).
7. **Level thresholds**:
   - 0–40%: Beginner
   - 41–70%: Intermediate
   - 71–100%: Advanced
8. **UI style**: Minimal, professional, Apple/Linear-inspired with Tailwind CSS.

## Admin Panel

Access at `/admin/results` (no auth in MVP). View all results, search by test name.

## Future Improvements (out of scope for MVP)

- Authentication (admin login)
- Database (PostgreSQL/MongoDB)
- Real-time updates (WebSockets)
- Export results (CSV/Excel)
- Question shuffle
- Multi-language support

## License

MIT
