# Design Decisions

## What do you treat as a memory versus ignore, and how did you decide?

A memory is defined as any fact that is likely to remain relevant across future conversations with the same user. We persist durable information in the following categories: identity (name), employment (role and employer), dietary preferences, long-term goals, and stable location details. We deliberately exclude transient context such as current weather, passing emotional states, and conversational filler, as these do not meaningfully inform future interactions.

This distinction is enforced programmatically rather than left to implicit model behaviour. During extraction, the language model tags each candidate fact as either `durable` or `transient`. Only facts marked `durable` are written to the database. The criteria mirror the standard a person would apply when forming a lasting impression of someone: professional role and dietary restrictions are retained; momentary complaints about rain or mood are not.

## How does extraction work — when does it run, what does it cost per message?

Fact extraction runs once per user message, immediately after the assistant response is generated and persisted. It is implemented as a dedicated language model call, separate from the conversational response call. The extractor receives the user's message along with any existing known facts and returns structured JSON containing `category`, `fact`, `durability`, and `action` fields for each candidate memory.

The cost per message is **two LLM calls**: one invocation to generate the conversational reply, and one invocation to extract and evaluate durable facts. The first call handles conversation; the second runs immediately afterward on the same user message. JSON-mode output is used on the extraction call to improve structural reliability. Both calls are made through the Google Gemini API on every user turn. In production use, standard LLM API pricing would apply to each invocation, billed according to input and output token usage.

## Walk us through exactly what happens in storage at step 5 (the job change).

When the user states *"I left Stripe, I'm a PM at Notion now"*, the extractor identifies a change in employment and returns a fact with `category: "work"`, `durability: "durable"`, and `action: "supersede"`. The storage layer processes this as a sequential write: deactivate, then insert.

First, all active `work` memories for that `user_id` are marked `is_active: false`, deactivating the prior Stripe entry without deleting it. Second, a new document is inserted with the updated fact (*"PM at Notion"*) and `is_active: true`. Retrieval queries filter exclusively on active records, so subsequent sessions surface only the current employer. In step 7, when the user asks where they work, the system loads the Notion fact and the model responds accordingly. The superseded Stripe record remains in the database for audit purposes but is excluded from all read paths.

## How do you retrieve relevant memories for a given message, and why that approach at this scale?

At message time, the system loads all active memories for the requesting `user_id` from MongoDB and injects them into the chat system prompt as a numbered list of known facts. Session-scoped conversation history is retrieved separately, filtered by `session_id`, and supplied as turn-by-turn context for the current interaction only.

Full-fact retrieval is appropriate at this scale because each user is expected to accumulate a small number of memories. The overhead of embedding generation, vector indexing, and similarity ranking is not justified when the entire memory set fits comfortably within the model's context window. This approach is deterministic, trivially debuggable via the application's memory panel, and guarantees that no stored fact is inadvertently omitted due to ranking thresholds.

## If this ran for 100k users over a year, what breaks first and what would you change?

The extraction pipeline would be the first component to require redesign. Two language model calls per message, applied uniformly across millions of interactions, would dominate both cost and latency. The immediate mitigation would be to introduce a pre-extraction gate using lightweight heuristics or a classifier to skip messages unlikely to contain durable facts, followed by asynchronous batch extraction for qualifying messages.

The MongoDB deployment would need to move from a single local instance to a managed cluster with replication and sharding once concurrent write volume and data size grow beyond single-node capacity. Retrieval would need to graduate from full-fact loading to semantic search via embeddings and a vector store, as individual users would accumulate hundreds of facts over time. The category-level supersession model would also require extension to support entity resolution and explicit conflict resolution when multiple facts within a category can legitimately coexist. Additional production concerns — memory decay, user confirmation for sensitive attributes, and continuous evaluation of extraction quality — would need to be addressed before operating at that scale.