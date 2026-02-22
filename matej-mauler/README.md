# Matěj Mauler — prezentační stránka

Jednostránková prezentace služeb s AI: tvorba webů a automatizace.

## Spuštění

```bash
npm install
npm run dev
```

Stránka poběží na http://localhost:3000 (nebo na portu z proměnné `PORT`). Jiný port např.: `PORT=3005 npm run dev`.

## Úpravy

- **Kontaktní formulář:** Aby se zprávy opravdu odesílaly, zkopírujte `.env.example` do `.env.local` a vyplňte `CONTACT_EMAIL` (kam chcete dostávat zprávy) a `RESEND_API_KEY` z [Resend](https://resend.com). Volitelně `RESEND_FROM_EMAIL` (odkaz musí být ověřený v Resend).
- **Barvy a fonty:** Upravte CSS proměnné v `app/globals.css` (`:root`).
- **Obrázky projektů:** Náhledy webů vložte do složky **`public/projekty/`** — viz `public/projekty/README.md` pro názvy souborů.

## Build

```bash
npm run build
npm start
```
