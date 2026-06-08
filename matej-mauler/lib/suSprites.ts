// Cartoon ink sprite zdroje hluku pro každý level.
import type { SourceKind } from "./soundUniverse";

const INK = "#1a1614";

export function drawSource(ctx: CanvasRenderingContext2D, kind: SourceKind, x: number, gY: number, nY: number, u: number) {
  ctx.save();
  ctx.lineWidth = Math.max(1.6, u * 0.2); ctx.strokeStyle = INK; ctx.lineJoin = "round"; ctx.lineCap = "round";
  const box = (bx: number, by: number, bw: number, bh: number, fill: string) => { ctx.fillStyle = fill; ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh); };
  const disc = (cx: number, cy: number, r: number, fill = INK) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = fill; ctx.fill(); };
  const wheel = (cx: number, cy: number, r: number) => { disc(cx, cy, r, INK); disc(cx, cy, r * 0.4, "#fff"); };
  const line = (x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };

  switch (kind) {
    case "cars": {
      const car = (cx: number, col: string, dir: number) => { const w = u * 2.8, h = u * 1.0, by = gY - h - u * 0.4; box(cx - w / 2, by, w, h, "#fff"); box(cx - w * 0.28 * dir - w * 0.1, by - h * 0.6, w * 0.55, h * 0.6, col); wheel(cx - w * 0.28, by + h, u * 0.34); wheel(cx + w * 0.28, by + h, u * 0.34); };
      car(x - u * 2.6, "#e05a5a", 1); car(x + u * 2.2, "#4a86e8", -1);
      break;
    }
    case "train": {
      const w = u * 5, h = u * 2.4, by = gY - h - u * 0.5, bx = x - w / 2;
      box(bx, by, w, h, "#2f6b3f"); box(bx + w * 0.58, by - u * 0.9, w * 0.34, u * 0.9, "#2f6b3f");
      box(bx + w * 0.66, by - u * 0.7, w * 0.2, u * 0.55, "#bfe3ff");
      box(bx + w * 0.14, by - u * 1.2, u * 0.5, u * 0.7, "#444"); // komín
      wheel(bx + w * 0.25, by + h, u * 0.5); wheel(bx + w * 0.55, by + h, u * 0.5); wheel(bx + w * 0.82, by + h, u * 0.5);
      ctx.strokeStyle = "rgba(26,22,20,0.5)"; line(x - u * 8, gY + u * 0.6, x + u * 8, gY + u * 0.6);
      break;
    }
    case "engine": {
      const w = u * 4, by = gY - u * 1.2, bx = x - w / 2;
      ctx.fillStyle = "#e23b3b"; ctx.beginPath(); ctx.moveTo(bx, by + u * 0.9); ctx.lineTo(bx + w * 0.2, by); ctx.lineTo(bx + w * 0.6, by); ctx.lineTo(bx + w * 0.72, by - u * 0.5); ctx.lineTo(bx + w, by - u * 0.5); ctx.lineTo(bx + w, by + u * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke();
      box(bx + w * 0.86, by - u * 1.1, u * 0.7, u * 0.5, INK); // spoiler
      wheel(bx + w * 0.22, by + u * 0.9, u * 0.5); wheel(bx + w * 0.78, by + u * 0.9, u * 0.5);
      break;
    }
    case "stage": {
      box(x - u * 4, gY - u * 1.1, u * 8, u * 1.1, INK); // pódium
      const spk = (sx: number) => { box(sx, gY - u * 4.4, u * 1.6, u * 3.3, INK); disc(sx + u * 0.8, gY - u * 3.5, u * 0.55, "#ff6fae"); disc(sx + u * 0.8, gY - u * 1.9, u * 0.35, "#ff6fae"); };
      spk(x - u * 4.4); spk(x + u * 2.8);
      disc(x, gY - u * 2.2, u * 0.6, "#ffd23f"); // DJ
      break;
    }
    case "machinery": case "factory": {
      const w = u * 4.5, h = u * 3, by = gY - h, bx = x - w / 2;
      box(bx, by, w, h, kind === "factory" ? "#9a9ca1" : "#e0a020");
      box(bx + w * 0.62, by - u * 2.6, u * 0.9, u * 2.6, "#7a7c80"); // komín
      disc(x - u * 0.6, by + h * 0.5, u * 0.9, "#444"); disc(x - u * 0.6, by + h * 0.5, u * 0.4, "#fff"); // ozubené kolo
      const smoke = (cx: number, cy: number, r: number) => disc(cx, cy, r, "rgba(120,120,120,0.6)");
      smoke(bx + w * 0.67, by - u * 3, u * 0.8); smoke(bx + w * 0.9, by - u * 3.7, u * 0.6);
      break;
    }
    case "crowd": {
      const w = u * 7, bx = x - w / 2; ctx.fillStyle = "#7a7c80";
      for (let i = 0; i < 4; i++) { const sh = u * (1 + i * 0.7); box(bx + i * (w / 4), gY - sh, w / 4 + 1, sh, "#8d8f95"); }
      for (let i = 0; i < 14; i++) disc(bx + (i % 7) * (w / 7) + u * 0.5, gY - u * (1.2 + (i % 4) * 0.7), u * 0.28, "#1a1614");
      break;
    }
    case "dog": {
      const w = u * 3, h = u * 2.2, by = gY - h, bx = x - w / 2; box(bx, by, w, h, "#b97a3a");
      ctx.fillStyle = "#7a4f22"; ctx.beginPath(); ctx.moveTo(bx - u * 0.4, by); ctx.lineTo(x, by - u * 1.1); ctx.lineTo(bx + w + u * 0.4, by); ctx.closePath(); ctx.fill(); ctx.stroke();
      disc(x, by + h * 0.5, u * 0.7, INK); // díra
      disc(x + w * 0.7, gY - u * 0.9, u * 0.6, "#5c3d22"); // pes
      break;
    }
    case "bell": {
      line(x - u * 2, gY, x - u * 2, nY); line(x + u * 2, gY, x + u * 2, nY); line(x - u * 2.4, nY, x + u * 2.4, nY);
      ctx.fillStyle = "#e0a020"; ctx.beginPath(); ctx.moveTo(x - u * 1.3, nY + u * 1.8); ctx.quadraticCurveTo(x - u * 1.3, nY + u * 0.3, x, nY + u * 0.3); ctx.quadraticCurveTo(x + u * 1.3, nY + u * 0.3, x + u * 1.3, nY + u * 1.8); ctx.closePath(); ctx.fill(); ctx.stroke();
      disc(x, nY + u * 2, u * 0.3, INK);
      break;
    }
    case "unit": {
      const w = u * 3, h = u * 2.4, by = gY - h, bx = x - w / 2; box(bx, by, w, h, "#c8cacd");
      ctx.strokeStyle = "rgba(26,22,20,0.5)"; for (let i = 1; i < 5; i++) line(bx + u * 0.3, by + (h / 5) * i, bx + w - u * 0.3, by + (h / 5) * i);
      ctx.strokeStyle = INK; disc(bx + w * 0.7, by + h * 0.5, u * 0.7, "#9a9ca1"); line(bx + w * 0.7, by + h * 0.5 - u * 0.6, bx + w * 0.7, by + h * 0.5 + u * 0.6);
      break;
    }
    case "turbine": {
      line(x, gY, x, nY); box(x - u * 0.5, nY - u * 0.5, u * 1, u * 1, "#e6e6ea");
      for (let a = 0; a < 3; a++) { const ang = (a * 120 + (Date.now() / 18) % 360) * Math.PI / 180; line(x, nY, x + Math.cos(ang) * u * 4, nY + Math.sin(ang) * u * 4); }
      break;
    }
    case "club": case "band": {
      const w = u * 5, h = u * 5, by = gY - h, bx = x - w / 2; box(bx, by, w, h, "#3a2f4a");
      box(bx + w * 0.2, by + u * 0.8, w * 0.6, u * 1.4, kind === "club" ? "#c060ff" : "#ff9f43");
      ctx.fillStyle = "#fff"; ctx.font = `700 ${u * 1.1}px system-ui`; ctx.textAlign = "center"; ctx.fillText(kind === "club" ? "♪" : "🎸", x, by + u * 2);
      box(bx + w * 0.36, by + h - u * 1.6, w * 0.28, u * 1.6, "#1a1614"); // dveře
      break;
    }
    case "heli": {
      ctx.fillStyle = "#7a7c80"; ctx.beginPath(); ctx.ellipse(x, nY, u * 2.2, u * 1.3, 0, 0, 7); ctx.fill(); ctx.stroke();
      box(x + u * 1.6, nY - u * 0.4, u * 3, u * 0.7, "#7a7c80"); // ocas
      line(x - u * 3, nY - u * 1.6, x + u * 3, nY - u * 1.6); line(x, nY - u * 1.6, x, nY - u * 1.2); // rotor
      line(x - u * 1.5, nY + u * 1.3, x - u * 1.5, nY + u * 2); line(x + u * 1.5, nY + u * 1.3, x + u * 1.5, nY + u * 2); line(x - u * 2, nY + u * 2, x + u * 2, nY + u * 2);
      break;
    }
    case "plane": {
      ctx.fillStyle = "#e6e6ea"; ctx.beginPath(); ctx.ellipse(x, nY, u * 3.4, u * 1.0, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - u * 0.6, nY); ctx.lineTo(x + u * 1.2, nY - u * 2); ctx.lineTo(x + u * 2, nY - u * 2); ctx.lineTo(x + u * 0.8, nY); ctx.closePath(); ctx.fill(); ctx.stroke(); // křídlo
      ctx.beginPath(); ctx.moveTo(x - u * 3, nY); ctx.lineTo(x - u * 3.6, nY - u * 1.3); ctx.lineTo(x - u * 2.6, nY - u * 1.3); ctx.lineTo(x - u * 2, nY); ctx.closePath(); ctx.fill(); ctx.stroke(); // ocas
      break;
    }
    case "gun": {
      box(x - u * 1.5, gY - u * 2, u * 1.6, u * 2, "#6f6a63"); // stěna/stojan
      line(x - u * 0.2, gY - u * 1.4, x + u * 2.4, gY - u * 1.4); // hlaveň
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); for (let a = 0; a < 8; a++) { const ang = a * Math.PI / 4; const r = a % 2 ? u * 0.5 : u * 1.2; ctx.lineTo(x + u * 2.4 + Math.cos(ang) * r, gY - u * 1.4 + Math.sin(ang) * r); } ctx.closePath(); ctx.fill(); // záblesk
      break;
    }
  }
  ctx.restore();
}
