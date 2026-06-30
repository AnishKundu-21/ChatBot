# Design Decisions

## What do you treat as a memory versus ignore, and how did you decide?

We persist **durable identity and preference facts**: name, job/employer, dietary restrictions, and long-term goals. We ignore **transient context**: weather, passing mood, and small-talk filler. The extraction prompt explicitly tags each candidate fact as `durable` or `transient`, and only `durable` facts are written to SQLite. This mirrors how a thoughtful person would remember someone — you'd recall they're vegetarian and training for a marathon, not that it was raining one afternoon.

## How does extraction work — when does it run, what does it cost per message?

Extraction runs **after every user message**, as a separate LLM call that returns structured JSON (`category`, `fact`, `durability`, `action`). This costs **2 LLM calls per user turn** (respond + extract). At demo scale with Gemini AI Studio's free tier, that's effectively $0. Running extraction on every message is simple and ensures nothing is missed; at higher scale you'd batch, debounce, or only extract when heuristics suggest new information.

## Walk us through exactly what happens in storage at step 5 (the job change).

When Maya says *"I left Stripe, I'm a PM at Notion now"*, the extractor returns a `work` fact with `action: "supersede"`. The store marks all active `work` memories for `maya` as `is_active = 0` (Stripe fact deactivated), then inserts the new Notion fact as active. Old facts remain in the DB for auditability but are excluded from retrieval. Step 7 then correctly returns Notion because only active facts are loaded.

## How do you retrieve relevant memories for a given message, and why that approach at this scale?

We load **all active facts** for the `user_id` and inject them into the chat system prompt. With a handful of facts per user, this is the simplest correct approach — no embeddings, no vector search, no ranking logic. Session conversation history is loaded separately and scoped to the current `session_id` only. At this scale, full-fact retrieval is fast, deterministic, and easy to debug in the "View Memories" panel.

## If this ran for 100k users over a year, what breaks first and what would you change?

**Extraction cost** breaks first — 2 LLM calls per message × millions of messages adds up. I'd move to batched/async extraction, cheaper models for extraction only, and heuristics to skip extraction on low-signal messages. **SQLite** would need sharding or migration to Postgres. **Retrieval** would need semantic search (embeddings + vector store) once users have hundreds of facts. **Fact supersession** would need entity resolution and conflict handling beyond simple category-level replace. I'd also add memory decay, user confirmation for sensitive facts, and observability around extraction quality.