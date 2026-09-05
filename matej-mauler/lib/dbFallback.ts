/**
 * Zavolá loader; když selže, zaloguje a vrátí náhradu.
 *
 * Volá se **až NAD** unstable_cache, nikdy uvnitř. Kdyby byl catch uvnitř
 * cachované funkce, uložila by se do cache náhrada a držela by se tam celý
 * revalidate interval — jeden zádrhel by znamenal deset minut špatného obsahu.
 * Takhle se chyba nikam neuloží a další požadavek to zkusí znovu.
 */
export async function withFallback<T>(
  what: string,
  load: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await load();
  } catch (e) {
    console.error(`[db] ${what} selhalo, servíruju náhradu:`, e);
    return fallback();
  }
}
