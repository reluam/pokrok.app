import { describe, expect, it } from "vitest";
import { langFromQuery, pickLang } from "./getLang";

describe("pickLang", () => {
  it("výchozí jazyk je angličtina", () => {
    expect(pickLang({})).toBe("en");
  });

  it("cookie má přednost před vším ostatním", () => {
    expect(pickLang({ cookie: "cs", host: "spaghetti.ltd", country: "US" })).toBe("cs");
    expect(pickLang({ cookie: "en", host: "spaghetti.cz", country: "CZ" })).toBe("en");
  });

  it("nesmyslná cookie se ignoruje, nepadá se na ní", () => {
    expect(pickLang({ cookie: "de" })).toBe("en");
    expect(pickLang({ cookie: "" })).toBe("en");
  });

  it("česká doména znamená češtinu", () => {
    expect(pickLang({ host: "spaghetti.cz" })).toBe("cs");
    expect(pickLang({ host: "www.spaghetti.cz:3000" })).toBe("cs");
  });

  it("doména nepřebije cookie ani neplete .cz uvnitř názvu", () => {
    expect(pickLang({ host: "cz.example.com" })).toBe("en");
  });

  it("geo CZ a SK dostane češtinu", () => {
    expect(pickLang({ country: "CZ" })).toBe("cs");
    expect(pickLang({ country: "SK" })).toBe("cs");
    expect(pickLang({ country: "DE" })).toBe("en");
  });
});

describe("langFromQuery", () => {
  it("bere platné jazyky", () => {
    expect(langFromQuery("cs")).toBe("cs");
    expect(langFromQuery("en")).toBe("en");
  });

  it("nesmysl neprojde — cookie se pak nemá čím přepsat", () => {
    expect(langFromQuery("de")).toBeNull();
    expect(langFromQuery("")).toBeNull();
    expect(langFromQuery(null)).toBeNull();
    expect(langFromQuery("cs; drop table")).toBeNull();
  });
});
