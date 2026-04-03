// Map of Žiju.life feature mentions → markdown links (longest patterns first)
const LINK_MAP: [RegExp, string][] = [
  [/Čtvrtletní check-?in/gi, "[Čtvrtletní check-in](/manual/dashboard#ctvrtletni-checkin)"],
  [/Energetick(?:ý|ého|ém) audit(?:u)?/gi, "[Energetický audit](/manual/dashboard#energie)"],
  [/Životní(?:ch)? filosof(?:ie|ii)/gi, "[Životní filozofie](/manual/dashboard#filozofie)"],
  [/Životní(?:ch)? oblast(?:í|i|ech)/gi, "[Životní oblasti](/manual/dashboard#oblasti)"],
  [/Vztahov(?:á|ou|é) map(?:a|u|y|ě)/gi, "[Vztahová mapa](/manual/dashboard#vztahy)"],
  [/Kompas(?:u|em)? hodnot/gi, "[Kompas hodnot](/manual/dashboard#kompas)"],
  [/Kolo života/gi, "[Kolo života](/manual/dashboard#kompas)"],
  [/Den za 5 let/gi, "[Den za 5 let](/manual/dashboard#vize)"],
  [/Smuteční řeč(?:i)?/gi, "[Smuteční řeč](/manual/dashboard#smutecni-rec)"],
  [/Nastav(?:ení)? si den/gi, "[Nastav si den](/manual/dashboard)"],
  [/Akční plán(?:u)?/gi, "[Akční plán](/manual/dashboard#akcni-plan)"],
  [/Přesvědčení/gi, "[Přesvědčení](/manual/dashboard#presvedceni)"],
  [/Princip(?:y|ů|ům|ech)/gi, "[Principy](/manual/dashboard#principy)"],
  [/(?:Moje |Mé |Tvoje |Tvé )?[Hh]odnot(?:y|ám|ami)/gi, "[Hodnoty](/manual/dashboard#hodnoty)"],
  [/Ikigai/gi, "[Ikigai](/manual/dashboard#ikigai)"],
  [/Knihovn(?:a|u|y|ě)/gi, "[Knihovna](/knihovna)"],
  [/Koučink(?:u|em)?/gi, "[Koučink](/koucing)"],
];

/**
 * Inject markdown links for Žiju.life feature mentions in AI responses.
 * Skips text that's already inside a markdown link.
 */
export function injectLinks(text: string): string {
  // Split text into link vs non-link segments
  const parts: { text: string; isLink: boolean }[] = [];
  const linkRe = /\[([^\]]+)\]\([^)]+\)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  while ((match = linkRe.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), isLink: false });
    parts.push({ text: match[0], isLink: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isLink: false });
  if (parts.length === 0) parts.push({ text, isLink: false });

  return parts.map((p) => {
    if (p.isLink) return p.text;
    let result = p.text;
    for (const [pattern, replacement] of LINK_MAP) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }).join("");
}
