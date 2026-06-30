# Memory Chatbot

A web-based conversational agent with persistent, per-user memory across independent sessions. The application extracts durable facts from natural language dialogue, stores them in a local MongoDB database, and retrieves them in subsequent sessions to inform future responses. User memory is fully isolated by `user_id`.

## Requirements

<table cellpadding="10" cellspacing="0" width="100%">
  <thead>
    <tr>
      <th align="left">Dependency</th>
      <th align="left">Version / Source</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Bun</td>
      <td><a href="https://bun.sh">bun.sh</a> — package manager</td>
    </tr>
    <tr>
      <td>Node.js</td>
      <td>20 or later</td>
    </tr>
    <tr>
      <td>MongoDB</td>
      <td>Community Edition, running locally — <a href="https://www.mongodb.com/try/download/community">download</a></td>
    </tr>
    <tr>
      <td>Google Gemini</td>
      <td>API key from <a href="https://aistudio.google.com/apikey">Google AI Studio</a></td>
    </tr>
  </tbody>
</table>

## Installation

```bash
bun install
cp .env.example .env
```

Configure the following environment variables in `.env`:

<table cellpadding="10" cellspacing="0" width="100%">
  <thead>
    <tr>
      <th align="left">Variable</th>
      <th align="left">Description</th>
      <th align="left">Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>GEMINI_API_KEY</code></td>
      <td>Google AI Studio API key</td>
      <td><code>&lt;your-api-key&gt;</code></td>
    </tr>
    <tr>
      <td><code>GEMINI_MODEL</code></td>
      <td>Gemini model identifier</td>
      <td><code>gemini-2.0-flash</code></td>
    </tr>
    <tr>
      <td><code>MONGODB_URI</code></td>
      <td>MongoDB connection string</td>
      <td><code>mongodb://localhost:27017</code></td>
    </tr>
    <tr>
      <td><code>MONGODB_DB_NAME</code></td>
      <td>Database name</td>
      <td><code>memory_chatbot</code></td>
    </tr>
    <tr>
      <td><code>PORT</code></td>
      <td>API server port</td>
      <td><code>3000</code></td>
    </tr>
  </tbody>
</table>

Ensure the MongoDB service is running before starting the application.

## Running the Application

```bash
bun run dev
```

<table cellpadding="10" cellspacing="0" width="100%">
  <thead>
    <tr>
      <th align="left">Service</th>
      <th align="left">URL</th>
      <th align="left">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Web interface</td>
      <td><a href="http://localhost:5173"><code>http://localhost:5173</code></a></td>
      <td>Chat UI and session controls</td>
    </tr>
    <tr>
      <td>API server</td>
      <td><a href="http://localhost:3000"><code>http://localhost:3000</code></a></td>
      <td>Backend REST API</td>
    </tr>
    <tr>
      <td>Health check</td>
      <td><a href="http://localhost:3000/api/health"><code>/api/health</code></a></td>
      <td>Service status endpoint</td>
    </tr>
  </tbody>
</table>

The development command starts both the backend API server and the Vite frontend concurrently. API requests from the frontend are proxied automatically.

## Demo Recording

The video below walks through the full assessment scenario, including all four sessions with users `maya` and `sam`.

<video src="demo.mp4" controls width="100%">
  Your browser does not support embedded video.
  <a href="demo.mp4">Download demo.mp4</a>
</video>

## Evaluation Scenario

The application is designed to satisfy the assessment script below. Each session represents a separate program run. Select **New Session** between sessions to clear conversational context while preserving stored memories.

Set **User ID** to `maya` for steps 1 through 7.

<table cellpadding="10" cellspacing="0" width="100%">
  <thead>
    <tr>
      <th align="left">Session</th>
      <th align="left">User</th>
      <th align="left">Step</th>
      <th align="left">Message</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3">1</td>
      <td rowspan="3"><code>maya</code></td>
      <td>1</td>
      <td><code>Hey, I'm Maya. I'm a product manager at Stripe.</code></td>
    </tr>
    <tr>
      <td>2</td>
      <td><code>Ugh, it's pouring rain here and I'm in a terrible mood lol.</code></td>
    </tr>
    <tr>
      <td>3</td>
      <td><code>I'm training for a half marathon in October. Also I'm vegetarian.</code></td>
    </tr>
    <tr>
      <td colspan="4" align="center"><em>Select <strong>New Session</strong></em></td>
    </tr>
    <tr>
      <td rowspan="3">2</td>
      <td rowspan="3"><code>maya</code></td>
      <td>4</td>
      <td><code>What do you know about me so far?</code></td>
    </tr>
    <tr>
      <td>5</td>
      <td><code>Quick update — I left Stripe, I'm a PM at Notion now.</code></td>
    </tr>
    <tr>
      <td>6</td>
      <td><code>Suggest a post-run dinner for me.</code></td>
    </tr>
    <tr>
      <td colspan="4" align="center"><em>Select <strong>New Session</strong></em></td>
    </tr>
    <tr>
      <td>3</td>
      <td><code>maya</code></td>
      <td>7</td>
      <td><code>Where do I work again?</code></td>
    </tr>
    <tr>
      <td colspan="4" align="center"><em>Select <strong>New Session</strong> — change User ID to <code>sam</code></em></td>
    </tr>
    <tr>
      <td>4</td>
      <td><code>sam</code></td>
      <td>8</td>
      <td><code>Hi! What do you know about me?</code></td>
    </tr>
  </tbody>
</table>

The **View Memories** panel displays all persisted facts for the active user and may be used to verify storage behaviour at steps 4, 5, and 7.

## Architecture

<table cellpadding="10" cellspacing="0" width="100%">
  <thead>
    <tr>
      <th align="left">Layer</th>
      <th align="left">Technology</th>
      <th align="left">Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Frontend</td>
      <td>React · Vite · Tailwind CSS</td>
      <td>Chat interface, session controls, memory inspection</td>
    </tr>
    <tr>
      <td>API</td>
      <td>Hono · Node.js</td>
      <td>Request handling, memory orchestration</td>
    </tr>
    <tr>
      <td>Storage</td>
      <td>MongoDB</td>
      <td>Persistent facts (<code>memories</code>) and session messages (<code>messages</code>)</td>
    </tr>
    <tr>
      <td>Language model</td>
      <td>Google Gemini</td>
      <td>Conversational response and structured fact extraction</td>
    </tr>
  </tbody>
</table>

Each user message triggers two language model invocations: one to generate the assistant reply, and one to extract durable facts for storage. Design rationale is documented in `DECISIONS.md`.

## Project Structure

```
server/
  index.ts              Application entry point
  routes/chat.ts        API endpoints
  memory/               Storage, retrieval, and extraction logic
  llm/gemini.ts         Gemini API client
  prompts/              System prompts for chat and extraction

client/
  src/                  React application

DECISIONS.md            Design decisions and scaling analysis
```

## API Endpoints

<table cellpadding="10" cellspacing="0" width="100%">
  <thead>
    <tr>
      <th align="left">Method</th>
      <th align="left">Path</th>
      <th align="left">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>GET</code></td>
      <td><code>/api/health</code></td>
      <td>Service health check</td>
    </tr>
    <tr>
      <td><code>POST</code></td>
      <td><code>/api/session/new</code></td>
      <td>Create a new session identifier</td>
    </tr>
    <tr>
      <td><code>POST</code></td>
      <td><code>/api/chat</code></td>
      <td>Send a message and receive a reply</td>
    </tr>
    <tr>
      <td><code>GET</code></td>
      <td><code>/api/memories/:user_id</code></td>
      <td>Retrieve active memories for a user</td>
    </tr>
    <tr>
      <td><code>DELETE</code></td>
      <td><code>/api/memories/:user_id</code></td>
      <td>Clear all memories for a user</td>
    </tr>
  </tbody>
</table>