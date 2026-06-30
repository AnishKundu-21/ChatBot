# Memory Chatbot

A web chatbot with **persistent per-user memory** across sessions. Built for the internship exercise — each `user_id` has isolated, durable facts stored in SQLite that survive "New Session" clicks.

## Prerequisites

- [Bun](https://bun.sh) (package manager)
- Node.js 20+
- OpenRouter API key ([openrouter.ai/keys](https://openrouter.ai/keys))

## Setup

```bash
bun install
cp .env.example .env
```

Edit `.env`:

```
OPENROUTER_API_KEY=sk-or-your-key
OPENROUTER_MODEL=openrouter/free   # or any free model from openrouter.ai/models
```

## Run

```bash
bun run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000

## Interview Walkthrough (Exact Scenario)

Use **User ID: `maya`** for steps 1–7. Click **New Session** between sessions 1, 2, and 3.

### Session 1 — user `maya`

1. `Hey, I'm Maya. I'm a product manager at Stripe.`
2. `Ugh, it's pouring rain here and I'm in a terrible mood lol.`
3. `I'm training for a half marathon in October. Also I'm vegetarian.`

Click **New Session**.

### Session 2 — user `maya`

4. `What do you know about me so far?`
5. `Quick update — I left Stripe, I'm a PM at Notion now.`
6. `Suggest a post-run dinner for me.`

Click **New Session**.

### Session 3 — user `maya`

7. `Where do I work again?`

Click **New Session**. Change **User ID** to `sam`.

### Isolation check — user `sam`

8. `Hi! What do you know about me?`

**View Memories** panel shows persisted facts per user — useful when explaining steps 4, 5, and 7.

## Architecture

- **Frontend:** React + Vite + Tailwind
- **Backend:** Hono on Node.js
- **Storage:** SQLite (`memory.db`)
- **LLM:** OpenRouter (extraction + chat)

Each message triggers two LLM calls: one to respond, one to extract durable facts.