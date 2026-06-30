import "./env.js";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { closeMongo, connectMongo } from "./memory/db.js";

const port = Number(process.env.PORT) || 3000;

await connectMongo();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set — /api/chat will fail.");
  }
});

process.on("SIGINT", async () => {
  await closeMongo();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeMongo();
  process.exit(0);
});