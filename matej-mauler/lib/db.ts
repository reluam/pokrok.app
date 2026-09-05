import { neon } from "@neondatabase/serverless";

// Přes pomocnou funkci schválně: `ReturnType<typeof neon>` by generiky rozšířil
// na NeonQueryFunction<boolean, boolean> a volající, kteří čekají <false, false>,
// by přestali typovat.
function build(url: string) {
  return neon(url);
}

// Klient se staví jednou za instanci. Driver jede přes HTTP, takže nedrží
// spojení — ale stavět ho při každém z 61 volání getDb() je zbytečná práce.
let client: ReturnType<typeof build> | null = null;
let builtFrom: string | null = null;

/** Jen pro testy — zahodí zapamatovaného klienta. */
export function resetDb(): void {
  client = null;
  builtFrom = null;
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!client || builtFrom !== url) {
    client = build(url);
    builtFrom = url;
  }
  return client;
}
