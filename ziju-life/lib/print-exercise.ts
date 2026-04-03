function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function printExercise({ title, sections }: {
  title: string;
  sections: { heading?: string; text: string }[];
}) {
  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>${title} — Žiju.life</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 210mm; height: 297mm; font-family: Georgia, 'Times New Roman', serif; }
  body {
    display: flex; flex-direction: column;
    padding: 20mm 24mm;
    color: #1a1a1a;
  }
  .header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12mm;
    padding-bottom: 6mm;
    border-bottom: 1px solid #e5e5e5;
  }
  .brand {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 11pt; font-weight: 700; letter-spacing: 0.02em;
    color: #999;
  }
  .title {
    font-size: 22pt; font-weight: 700; color: #1a1a1a;
  }
  .content { flex: 1; display: flex; flex-direction: column; gap: 8mm; }
  .section-heading {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 9pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: #999; margin-bottom: 2mm;
  }
  .section-text {
    font-size: 12pt; line-height: 1.7; color: #333;
    white-space: pre-wrap;
  }
  .footer {
    margin-top: auto; padding-top: 6mm;
    border-top: 1px solid #e5e5e5;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 8pt; color: #bbb; text-align: center;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="title">${title}</div>
    <div class="brand">Žiju.life</div>
  </div>
  <div class="content">
    ${sections.map(s => `
      <div>
        ${s.heading ? `<div class="section-heading">${esc(s.heading)}</div>` : ''}
        <div class="section-text">${esc(s.text)}</div>
      </div>
    `).join('')}
  </div>
  <div class="footer">Žiju.life — Manuál na život</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.print(); };
}
