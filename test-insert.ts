import { drizzle } from "drizzle-orm/mysql2";
import { journalEntries } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function testInsert() {
  try {
    const result = await db.insert(journalEntries).values({
      userId: 1,
      question: "Test question",
      response: "Test response"
    });
    
    console.log("Full result object:", JSON.stringify(result, null, 2));
    console.log("Result keys:", Object.keys(result));
    console.log("Result type:", typeof result);
    console.log("insertId:", (result as any).insertId);
    console.log("insertId type:", typeof (result as any).insertId);
  } catch (error) {
    console.error("Error:", error);
  }
}

testInsert().then(() => process.exit(0)).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
