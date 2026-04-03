function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function printExercise({ title, emoji, sections }: {
  title: string;
  emoji?: string;
  sections: { heading?: string; text: string }[];
}) {
  const logoUrl = `${window.location.origin}/ziju-life-logo.png`;
  const date = new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>${esc(title)} — Žiju.life</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 210mm; min-height: 297mm;
    font-family: 'Nunito', system-ui, -apple-system, sans-serif;
    background: #FFFAF5;
    color: #171717;
  }
  body {
    display: flex; flex-direction: column;
    padding: 18mm 22mm 14mm;
  }

  /* ── Header ── */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10mm;
    padding-bottom: 7mm;
    border-bottom: 2.5px solid #FF8C42;
  }
  .header-left { display: flex; align-items: center; gap: 4mm; }
  .header-emoji { font-size: 28pt; }
  .header-title {
    font-size: 24pt; font-weight: 800; color: #171717;
    letter-spacing: -0.01em;
  }
  .header-logo img { height: 11mm; display: block; }

  /* ── Accent bar ── */
  .accent-bar {
    height: 3px;
    background: linear-gradient(90deg, #FF8C42, #4ECDC4, #B0A7F5, #FFD966);
    border-radius: 2px;
    margin-bottom: 8mm;
  }

  /* ── Content ── */
  .content { flex: 1; display: flex; flex-direction: column; gap: 7mm; }
  .section { page-break-inside: avoid; }
  .section-heading {
    font-size: 8.5pt; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.12em; color: #FF8C42;
    margin-bottom: 2.5mm;
    padding-bottom: 1.5mm;
    border-bottom: 1.5px solid rgba(255, 140, 66, 0.2);
  }
  .section-text {
    font-size: 11pt; line-height: 1.75; color: #333;
    white-space: pre-wrap;
  }

  /* ── Decorative quote marks for single-section exercises ── */
  .quote-mark {
    font-size: 48pt; color: rgba(255, 140, 66, 0.15);
    font-family: Georgia, serif; line-height: 1;
    margin-bottom: -4mm;
  }

  /* ── Footer ── */
  .footer {
    margin-top: auto;
    padding-top: 6mm;
    border-top: 1.5px solid rgba(255, 140, 66, 0.2);
    display: flex; align-items: center; justify-content: space-between;
    font-size: 8pt; color: #999;
  }
  .footer-left { font-weight: 600; }
  .footer-right { }
  .footer-dot {
    display: inline-block; width: 4px; height: 4px;
    border-radius: 50%; background: #FF8C42;
    margin: 0 2mm; vertical-align: middle;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${emoji ? `<span class="header-emoji">${emoji}</span>` : ''}
      <span class="header-title">${esc(title)}</span>
    </div>
    <div class="header-logo">
      <img src="${logoUrl}" alt="Žiju.life" />
    </div>
  </div>

  <div class="accent-bar"></div>

  <div class="content">
    ${sections.length === 1 && !sections[0].heading ? `
      <div class="section">
        <div class="quote-mark">"</div>
        <div class="section-text">${esc(sections[0].text)}</div>
      </div>
    ` : sections.map(s => `
      <div class="section">
        ${s.heading ? `<div class="section-heading">${esc(s.heading)}</div>` : ''}
        <div class="section-text">${esc(s.text)}</div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <div class="footer-left">Žiju.life <span class="footer-dot"></span> Manuál na život</div>
    <div class="footer-right">${date}</div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  // Wait for logo + font to load before printing
  win.onload = () => { setTimeout(() => win.print(), 300); };
}
