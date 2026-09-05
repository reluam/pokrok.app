import { afterEach, beforeEach, describe, expect, it } from "vitest";

const OLD = process.env.DATABASE_URL;
beforeEach(() => { process.env.DATABASE_URL = "postgres://u:p@example.test/db"; });
afterEach(() => { process.env.DATABASE_URL = OLD; });

describe("getDb", () => {
  it("vrací tentýž klient, nestaví nový při každém volání", async () => {
    const { getDb, resetDb } = await import("./db");
    resetDb();
    expect(getDb()).toBe(getDb());
  });

  it("bez DATABASE_URL sroluje s jasnou hláškou", async () => {
    const { getDb, resetDb } = await import("./db");
    delete process.env.DATABASE_URL;
    resetDb();
    expect(() => getDb()).toThrow("DATABASE_URL");
  });

  it("po změně URL postaví nového klienta", async () => {
    const { getDb, resetDb } = await import("./db");
    resetDb();
    const a = getDb();
    process.env.DATABASE_URL = "postgres://u:p@jiny.test/db";
    expect(getDb()).not.toBe(a);
  });
});
