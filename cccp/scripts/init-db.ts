import { initializeCoachCrmDatabase } from "../lib/db";

async function main() {
  console.log("Inicializuji databázi...");
  try {
    await initializeCoachCrmDatabase();
    console.log("✓ Databáze úspěšně inicializována!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Chyba při inicializaci:", error);
    process.exit(1);
  }
}

main();
