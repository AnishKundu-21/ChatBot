import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = dotenv.config({ path: path.join(root, ".env") });

if (result.error && !process.env.GEMINI_API_KEY) {
  console.warn(
    `[env] Could not load .env from ${path.join(root, ".env")} — set GEMINI_API_KEY before chatting.`
  );
}