import { drizzle } from "drizzle-orm/mysql2";
import { journalEntries } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function checkJournal() {
  const entries = await db.select().from(journalEntries).limit(5);
  console.log("Journal entries:", JSON.stringify(entries, null, 2));
  console.log("ID types:", entries.map(e => ({ id: e.id, type: typeof e.id })));
}

checkJournal().then(() => process.exit(0)).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
