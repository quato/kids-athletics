import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// @neondatabase/serverless uses HTTP/WebSocket per request instead of a
// persistent TCP connection, which avoids stale-connection errors when
// Neon's compute auto-suspends between serverless invocations.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
