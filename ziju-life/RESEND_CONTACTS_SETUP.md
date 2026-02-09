# Resend Contacts Integration

Tento projekt podporuje dvě možnosti správy kontaktů pro newsletter:

1. **Lokální databáze** (výchozí) - kontakty se ukládají do PostgreSQL databáze
2. **Resend Contacts API** - kontakty se spravují přes Resend Contacts API a odesílání probíhá přes Broadcasts API

## Výhody Resend Contacts

- **Lepší deliverability** - Resend automaticky spravuje unsubscribe a bounce handling
- **Centralizovaná správa** - všechny kontakty na jednom místě v Resend dashboardu
- **Broadcasts API** - efektivnější hromadné odesílání
- **Automatické tracking** - Resend poskytuje statistiky o otevření a kliknutí

## Nastavení

### 1. Aktivace Resend Contacts

Přidej do `.env` souboru:

```env
USE_RESEND_CONTACTS=true
```

### 2. Ověření domény v Resend

1. Přihlas se do [Resend Dashboard](https://resend.com/domains)
2. Přidej doménu `mail.ziju.life`
3. Přidej DNS záznamy (SPF, DKIM, DMARC) do DNS nastavení domény
4. Počkej na ověření

### 3. Synchronizace existujících kontaktů

Pokud už máš kontakty v lokální databázi a chceš je synchronizovat do Resend:

```typescript
import { syncContactsToResend } from '@/lib/resend-contacts'

// Spusť jednou pro synchronizaci všech kontaktů
await syncContactsToResend()
```

Můžeš to udělat přes API endpoint nebo jednorázový script.

## Jak to funguje

### Při přihlášení k newsletteru

1. Kontakt se vytvoří v lokální databázi (pro backup)
2. Pokud je `USE_RESEND_CONTACTS=true`, kontakt se také přidá do Resend Contacts

### Při odesílání newsletteru

- **S Resend Contacts**: Použije se Broadcasts API pro hromadné odesílání
- **Bez Resend Contacts**: Odesílají se individuální emaily přes Resend Emails API

### Při odhlášení

1. Kontakt se odstraní z lokální databáze
2. Pokud je `USE_RESEND_CONTACTS=true`, kontakt se označí jako unsubscribed v Resend

## Fallback mechanismus

Pokud Broadcasts API selže (např. kvůli chybě API nebo nedostupnosti), systém automaticky přepne na odesílání individuálních emailů, takže newsletter se vždy odešle.

## Poznámky

- Resend Contacts API vyžaduje platný Resend API klíč
- Broadcasts API vyžaduje alespoň jeden kontakt v Resend
- Pokud nemáš žádné kontakty v Resend, systém automaticky použije lokální databázi
