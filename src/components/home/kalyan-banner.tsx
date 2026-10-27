"use client";

import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   The Oyster & the Swati Star — canvas animation

   Indian myth: an oyster rises to the ocean surface and opens
   its mouth, waiting patiently for the single raindrop that falls
   when the star Swati is in ascendance. Only that one drop can
   become a pearl.

   Timeline (12-second loop):
     0 – 1 s   Night scene, stars, gentle rain
     1 – 2.5 s Swati pulses brighter; oyster slowly opens
     2.5 – 3 s Oyster fully open, waiting
     3 – 4.5 s ONE glowing pearl-drop falls from Swati to oyster
     4.5 – 5.5 s Drop enters; oyster closes with a soft shiver
     5.5 – 7 s Ripples; ocean stills; oyster glows from within
     7 – 8.5 s Oyster reopens to reveal the luminous pearl
     8.5 – 10.5 s Pearl rises on the water, halo + sparkles
     10.5 – 12 s Pearl fades, oyster closes, cycle resets
   ═══════════════════════════════════════════════════════════════ */

// ── Maths ────────────────────────────────────────────────────────
const TAU = Math.PI * 2;
function clamp(v: number, lo = 0, hi = 1) { return v < lo ? lo : v > hi ? hi : v; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * clamp(t); }
/** Map p∈[0,1] to local [0,1] within window [a,b] */
function ph(p: number, a: number, b: number) { return clamp((p - a) / (b - a)); }
/** Cubic ease-in-out */
function eio(t: number) {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── LCG seeded RNG ────────────────────────────────────────────────
function mkrng(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ── Pre-computed scene geometry (stable across frames) ────────────

/** Dim background stars: [x_frac, y_frac, radius] */
const BG_STARS = (() => {
  const r = mkrng(17);
  return Array.from({ length: 28 }, () => [r(), r() * 0.46, lerp(0.4, 1.5, r())] as const);
})();

/** Hill silhouette control points for 3 layers */
const HILL_LAYERS = [
  // [ topY_frac, ...horizon [xf, yf] pairs ]
  {
    yBase: 0.28, op: 0.40, bl: 4, c0: "#1e3848", c1: "#10202e",
    pts: [0,.28, .06,.24, .13,.27, .20,.22, .28,.26, .36,.20, .44,.24, .52,.18, .60,.23, .68,.20, .76,.25, .84,.22, .92,.26, 1,.23],
  },
  {
    yBase: 0.33, op: 0.68, bl: 1.5, c0: "#142a38", c1: "#0a1c28",
    pts: [0,.33, .05,.29, .11,.32, .17,.27, .24,.31, .31,.25, .38,.29, .46,.23, .53,.28, .60,.24, .67,.29, .74,.25, .81,.30, .88,.27, .95,.31, 1,.28],
  },
  {
    yBase: 0.38, op: 1.00, bl: 0, c0: "#0c1c24", c1: "#060e14",
    pts: [0,.38, .04,.34, .09,.38, .15,.32, .22,.36, .29,.30, .35,.34, .42,.29, .49,.33, .56,.28, .63,.32, .69,.29, .76,.34, .83,.30, .90,.35, .97,.31, 1,.35],
  },
] as const;

// ── Rain drops ────────────────────────────────────────────────────
interface Drop { x: number; y: number; len: number; spd: number; op: number }
function mkDrops(W: number, H: number): Drop[] {
  const r = mkrng(5);
  return Array.from({ length: 70 }, () => ({
    x: r() * W, y: r() * H * 0.55,
    len: lerp(10, 26, r()),
    spd: lerp(5, 14, r()),
    op:  lerp(0.05, 0.18, r()),
  }));
}

// ── Oyster drawing ────────────────────────────────────────────────
/**
 * Draws a scalloped oyster shell with both halves.
 * @param openFrac  0 = fully closed, 1 = fully open (top shell ~110° up)
 * @param shimmer   0-1 inner glow intensity (pearl forming)
 */
function drawOyster(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number,
  openFrac: number,
  shimmer = 0,
) {
  const MAX_ANGLE = Math.PI * 0.60; // 108° fully open
  const angle = eio(openFrac) * MAX_ANGLE;
  const RIDGES = 9;

  ctx.save();
  ctx.translate(cx, cy);

  // Shell gradient (used for both halves)
  const mkShellG = (y0: number, y1: number) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0,    "#909e9c");
    g.addColorStop(0.30, "#6e8280");
    g.addColorStop(0.65, "#506664");
    g.addColorStop(1,    "#374e4c");
    return g;
  };

  // Half-shell path: flip=+1 → bottom arc, flip=−1 → top arc
  const halfShell = (flip: number) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i <= 30; i++) {
      const a = Math.PI * i / 30;
      const rr = 1 + 0.065 * Math.sin(a * RIDGES);
      ctx.lineTo(Math.cos(a) * w * rr, flip * Math.sin(a) * h * 0.54 * rr);
    }
    ctx.closePath();
  };

  const radialRidges = (flip: number) => {
    for (let i = 1; i < RIDGES; i++) {
      const a = Math.PI * i / RIDGES;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * w * 0.94, flip * Math.sin(a) * h * 0.52);
      ctx.strokeStyle = "rgba(0,0,0,.13)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  };

  // ── Interior nacre / shimmer (visible when open) ──────────────
  const iA = clamp(openFrac * 3);
  if (iA > 0.02) {
    // Bottom cup interior
    ctx.save();
    ctx.globalAlpha = iA;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.06, w * 0.86, h * 0.40, 0, 0, Math.PI);
    const ig = ctx.createRadialGradient(w * 0.08, h * 0.10, 0, 0, h * 0.16, w * 0.84);
    ig.addColorStop(0,    "rgba(242,230,255,.96)");
    ig.addColorStop(0.40, "rgba(215,222,248,.80)");
    ig.addColorStop(0.75, "rgba(188,210,238,.50)");
    ig.addColorStop(1,    "rgba(168,200,228,0)");
    ctx.fillStyle = ig; ctx.fill();
    ctx.restore();

    // Top lid interior
    ctx.save();
    ctx.globalAlpha = iA;
    // (draw before rotating the top shell)
    ctx.restore();
  }

  // ── Shimmer (pearl forming light) ────────────────────────────
  if (shimmer > 0.02 && openFrac < 0.12) {
    // Glow seeping through closed shell seam
    ctx.save();
    ctx.globalAlpha = shimmer * 0.55;
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 1.2);
    sg.addColorStop(0,   "rgba(255,245,255,.9)");
    sg.addColorStop(0.3, "rgba(230,215,255,.5)");
    sg.addColorStop(1,   "rgba(200,200,255,0)");
    ctx.beginPath(); ctx.ellipse(0, 0, w * 1.2, h * 0.35, 0, 0, TAU);
    ctx.fillStyle = sg; ctx.fill();
    ctx.restore();
  }

  // ── Bottom shell ─────────────────────────────────────────────
  ctx.save();
  halfShell(1);
  ctx.fillStyle = mkShellG(0, h * 0.58); ctx.fill();
  ctx.strokeStyle = "#223c3a"; ctx.lineWidth = 1.5; ctx.stroke();
  radialRidges(1);
  ctx.restore();

  // ── Top shell (rotates upward when open) ─────────────────────
  ctx.save();
  ctx.rotate(-angle);

  // Top interior nacre
  if (iA > 0.02) {
    ctx.save();
    ctx.globalAlpha = iA;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.06, w * 0.86, h * 0.40, 0, Math.PI, 0);
    const ig2 = ctx.createRadialGradient(-w * 0.08, -h * 0.10, 0, 0, -h * 0.16, w * 0.84);
    ig2.addColorStop(0,    "rgba(255,246,255,.96)");
    ig2.addColorStop(0.40, "rgba(232,225,252,.80)");
    ig2.addColorStop(0.75, "rgba(205,216,244,.50)");
    ig2.addColorStop(1,    "rgba(182,208,238,0)");
    ctx.fillStyle = ig2; ctx.fill();
    ctx.restore();
  }

  halfShell(-1);
  ctx.fillStyle = mkShellG(-h * 0.58, 0); ctx.fill();
  ctx.strokeStyle = "#223c3a"; ctx.lineWidth = 1.5; ctx.stroke();
  radialRidges(-1);
  ctx.restore();

  ctx.restore();
}

// ── Pearl sub-draw ────────────────────────────────────────────────
function drawPearl(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, alpha: number,
) {
  // Iridescent body (white → lavender → pale blue)
  const pg = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, 0, x, y, r);
  pg.addColorStop(0,    `rgba(255,255,255,${alpha})`);
  pg.addColorStop(0.18, `rgba(252,246,255,${alpha})`);
  pg.addColorStop(0.40, `rgba(238,228,255,${alpha})`);
  pg.addColorStop(0.65, `rgba(215,222,252,${alpha})`);
  pg.addColorStop(0.84, `rgba(192,210,244,${alpha})`);
  pg.addColorStop(1,    `rgba(168,196,236,${alpha})`);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = pg; ctx.fill();

  // Primary specular dot
  ctx.beginPath();
  ctx.arc(x - r * 0.30, y - r * 0.30, r * 0.17, 0, TAU);
  ctx.fillStyle = `rgba(255,255,255,${alpha * 0.93})`; ctx.fill();

  // Secondary soft specular
  ctx.beginPath();
  ctx.arc(x + r * 0.40, y + r * 0.10, r * 0.07, 0, TAU);
  ctx.fillStyle = `rgba(255,255,255,${alpha * 0.50})`; ctx.fill();
}

// ── Main render ───────────────────────────────────────────────────
function render(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  p: number,       // cycle progress 0..1
  drops: Drop[],
  frame: number,
) {
  ctx.clearRect(0, 0, W, H);

  // ─ Sky ─────────────────────────────────────────────────────
  const skyG = ctx.createLinearGradient(0, 0, 0, H * 0.52);
  skyG.addColorStop(0,    "#05101a");
  skyG.addColorStop(0.35, "#091a28");
  skyG.addColorStop(0.7,  "#0e2636");
  skyG.addColorStop(1,    "#163040");
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, W, H * 0.52);

  // ─ Background stars ────────────────────────────────────────
  BG_STARS.forEach(([fx, fy, rad]) => {
    const twinkle = 0.55 + 0.45 * Math.sin(frame * 0.038 + fx * 41);
    ctx.beginPath();
    ctx.arc(fx * W, fy * H, rad * twinkle, 0, TAU);
    ctx.fillStyle = `rgba(195,218,248,${0.55 * twinkle})`;
    ctx.fill();
  });

  // ─ Swati star — bright, multi-rayed, at (35%, 13%) ────────
  const SX = W * 0.35;
  const SY = H * 0.13;
  // Swati brightens further as the drop approaches (p 0.22–0.50)
  const swatiBright = 1 + 0.4 * eio(ph(p, 0.22, 0.38)) * (1 - eio(ph(p, 0.38, 0.52)));
  const pulse = (0.72 + 0.28 * Math.sin(frame * 0.075)) * swatiBright;

  // 8 rays (4 long, 4 short)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const rLen = (i % 2 === 0 ? 22 : 13) * pulse;
    ctx.save();
    ctx.globalAlpha = 0.50 * pulse;
    ctx.strokeStyle = "#cce4ff";
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(SX + Math.cos(a) * 3.5, SY + Math.sin(a) * 3.5);
    ctx.lineTo(SX + Math.cos(a) * rLen, SY + Math.sin(a) * rLen);
    ctx.stroke();
    ctx.restore();
  }
  // Star core radial
  const starG = ctx.createRadialGradient(SX, SY, 0, SX, SY, 12 * pulse);
  starG.addColorStop(0,    "rgba(255,255,255,1)");
  starG.addColorStop(0.22, "rgba(210,236,255,.95)");
  starG.addColorStop(0.55, "rgba(165,212,255,.55)");
  starG.addColorStop(1,    "rgba(135,193,255,0)");
  ctx.beginPath(); ctx.arc(SX, SY, 12 * pulse, 0, TAU);
  ctx.fillStyle = starG; ctx.fill();

  // ─ Rain ────────────────────────────────────────────────────
  ctx.save();
  drops.forEach(d => {
    ctx.globalAlpha = d.op;
    ctx.strokeStyle = "#88b8cc";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - d.len * 0.18, d.y + d.len);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // ─ Hills ───────────────────────────────────────────────────
  HILL_LAYERS.forEach(layer => {
    ctx.save();
    ctx.globalAlpha = layer.op;
    if (layer.bl > 0) ctx.filter = `blur(${layer.bl}px)`;
    ctx.beginPath();
    const pts = layer.pts;
    ctx.moveTo(pts[0] * W, pts[1] * H);
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(pts[i] * W, pts[i + 1] * H);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    const g = ctx.createLinearGradient(0, layer.yBase * H, 0, H * 0.52);
    g.addColorStop(0, layer.c0); g.addColorStop(1, layer.c1);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  });

  // ─ Water ───────────────────────────────────────────────────
  const wTop = H * 0.46;
  const wG = ctx.createLinearGradient(0, wTop, 0, H);
  wG.addColorStop(0,    "#142a32");
  wG.addColorStop(0.18, "#0c2028");
  wG.addColorStop(0.55, "#071820");
  wG.addColorStop(1,    "#040e14");
  ctx.fillStyle = wG;
  ctx.fillRect(0, wTop, W, H - wTop);

  // Faint wave shimmer lines
  ctx.save();
  for (let row = 0; row < 5; row++) {
    const wy = wTop + H * 0.035 * (row + 1) + Math.sin(frame * 0.026 + row) * 1.5;
    ctx.globalAlpha = 0.040;
    ctx.strokeStyle = "#78b8b0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, wy); ctx.lineTo(W, wy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ─ Oyster scene ─────────────────────────────────────────────
  // Placed at water surface, horizontally centred
  const OX = W * 0.5;
  const OY = H * 0.50;       // sits exactly at water line
  const OW = clamp(W * 0.12, 30, 70);  // half-width (clamped for tiny screens)
  const OH = OW * 0.54;      // half-height

  // ── Oyster open/close schedule (in p = 0..1) ─────────────
  //  0.00–0.08  closed
  //  0.08–0.24  slowly opens (waiting)
  //  0.24–0.38  fully open (drop falling in)
  //  0.38–0.48  closes (received the drop)
  //  0.48–0.60  closed, pearl forming (shimmer seeps out)
  //  0.60–0.76  opens slowly (pearl inside glow)
  //  0.76–0.90  fully open (pearl rises)
  //  0.90–1.00  closes back, reset

  let openFrac: number;
  const shimmerIntensity = eio(ph(p, 0.48, 0.60)) * (1 - eio(ph(p, 0.60, 0.70)));

  if      (p < 0.08)  openFrac = 0;
  else if (p < 0.24)  openFrac = eio(ph(p, 0.08, 0.24));
  else if (p < 0.38)  openFrac = 1;
  else if (p < 0.48)  openFrac = 1 - eio(ph(p, 0.38, 0.48));
  else if (p < 0.60)  openFrac = 0;
  else if (p < 0.76)  openFrac = eio(ph(p, 0.60, 0.76));
  else if (p < 0.90)  openFrac = 1;
  else                openFrac = 1 - eio(ph(p, 0.90, 1.00));

  drawOyster(ctx, OX, OY, OW, OH, openFrac, shimmerIntensity);

  // ── Swati drop: falls from star → oyster (p 0.26–0.40) ───
  const dropP = ph(p, 0.26, 0.40);
  if (dropP > 0 && p < 0.40) {
    const dp = eio(dropP);
    const DX = lerp(SX, OX, dp);
    const DY = lerp(SY, OY - OH * 0.55, dp);
    const dAlpha = dropP > 0.88 ? 1 - (dropP - 0.88) / 0.12 : 1;

    // Luminous dashed trail from Swati to drop
    if (dropP < 0.65) {
      ctx.save();
      const tG = ctx.createLinearGradient(SX, SY, DX, DY);
      tG.addColorStop(0, "rgba(215,195,255,0)");
      tG.addColorStop(1, `rgba(228,188,248,${0.40 * (1 - dp) * dAlpha})`);
      ctx.setLineDash([4, 7]);
      ctx.strokeStyle = tG;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(SX, SY); ctx.lineTo(DX, DY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Glow halo around the drop
    const hG = ctx.createRadialGradient(DX, DY, 0, DX, DY, 16);
    hG.addColorStop(0,   `rgba(248,205,255,${0.60 * dAlpha})`);
    hG.addColorStop(0.5, `rgba(215,170,245,${0.28 * dAlpha})`);
    hG.addColorStop(1,   "rgba(188,148,230,0)");
    ctx.beginPath(); ctx.arc(DX, DY, 16, 0, TAU);
    ctx.fillStyle = hG; ctx.fill();

    // Drop sphere (pearl-pink iridescent bead)
    const dG = ctx.createRadialGradient(DX - 1.5, DY - 2, 0, DX, DY, 5.5);
    dG.addColorStop(0,    `rgba(255,252,255,${dAlpha})`);
    dG.addColorStop(0.30, `rgba(248,198,234,${dAlpha})`);
    dG.addColorStop(0.70, `rgba(228,160,216,${dAlpha})`);
    dG.addColorStop(1,    `rgba(208,132,200,${dAlpha})`);
    ctx.beginPath(); ctx.arc(DX, DY, 5.5, 0, TAU);
    ctx.fillStyle = dG; ctx.fill();

    // Specular on drop
    ctx.beginPath(); ctx.arc(DX - 1.5, DY - 1.8, 1.4, 0, TAU);
    ctx.fillStyle = `rgba(255,255,255,${dAlpha * 0.8})`; ctx.fill();
  }

  // ── Ripples after drop enters (p 0.38–0.58) ───────────────
  if (p > 0.38 && p < 0.60) {
    const rp = ph(p, 0.38, 0.60);
    for (let i = 0; i < 3; i++) {
      const start = i * 0.20;
      const rpi = clamp((rp - start) / (1.0 - start));
      if (rpi <= 0.005) continue;
      ctx.save();
      ctx.globalAlpha = (1 - rpi) * 0.68;
      ctx.strokeStyle = "#68b4b0";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(OX, OY + OH * 0.12, rpi * OW * 3.2, rpi * OW * 0.90, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Pearl inside oyster (p 0.62–0.80) ─────────────────────
  const piF  = eio(ph(p, 0.63, 0.78));
  const piFd = eio(ph(p, 0.78, 0.83));
  const piA  = piF * (1 - piFd);
  if (openFrac > 0.15 && piA > 0.02) {
    const PR = OW * 0.28;
    // Inner glow
    const ig = ctx.createRadialGradient(OX, OY, 0, OX, OY, PR * 3.2);
    ig.addColorStop(0,   `rgba(255,252,255,${0.55 * piA})`);
    ig.addColorStop(0.35,`rgba(238,228,255,${0.35 * piA})`);
    ig.addColorStop(0.70,`rgba(210,218,248,${0.15 * piA})`);
    ig.addColorStop(1,   "rgba(185,208,240,0)");
    ctx.beginPath(); ctx.arc(OX, OY, PR * 3.2, 0, TAU);
    ctx.fillStyle = ig; ctx.fill();

    drawPearl(ctx, OX, OY, PR, piA);
  }

  // ── Pearl rising (p 0.80–0.97) ────────────────────────────
  const riseP  = ph(p, 0.80, 0.97);
  const fadePr = ph(p, 0.92, 0.99);
  if (riseP > 0) {
    const PR    = OW * 0.33;
    const PY    = OY - eio(riseP) * H * 0.40;
    const alpha = (1 - eio(fadePr));

    // Wide outer halo
    const halo = ctx.createRadialGradient(OX, PY, 0, OX, PY, PR * 5);
    halo.addColorStop(0,    `rgba(248,240,255,${0.28 * alpha})`);
    halo.addColorStop(0.38, `rgba(228,215,255,${0.13 * alpha})`);
    halo.addColorStop(0.70, `rgba(200,200,255,${0.05 * alpha})`);
    halo.addColorStop(1,    "rgba(180,190,255,0)");
    ctx.beginPath(); ctx.arc(OX, PY, PR * 5, 0, TAU);
    ctx.fillStyle = halo; ctx.fill();

    // Reflection on water beneath rising pearl
    if (riseP < 0.55) {
      const reflY = OY + (OY - PY) * 0.35; // reflected below surface
      const rAlpha = alpha * (1 - riseP * 1.5) * 0.3;
      if (rAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = rAlpha;
        ctx.scale(1, -0.25);
        drawPearl(ctx, OX, -reflY / 0.25, PR * 0.65, 1);
        ctx.restore();
      }
    }

    drawPearl(ctx, OX, PY, PR, alpha);

    // 5 orbiting sparkles
    ([
      [-2.4, -0.8, 2.7], [2.2, -0.6, 2.3], [-1.8, 1.8, 2.0],
      [2.7,  1.2, 1.8],  [0.3, -2.5, 1.9],
    ] as const).forEach(([dx, dy, r], i) => {
      const sA = alpha * (0.60 + 0.40 * Math.sin(frame * 0.10 + i * 1.42));
      const sx = OX + dx * PR, sy = PY + dy * PR;
      const sG = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.8);
      sG.addColorStop(0,   `rgba(255,252,235,${sA})`);
      sG.addColorStop(0.4, `rgba(248,230,195,${sA * 0.50})`);
      sG.addColorStop(1,   "rgba(235,215,175,0)");
      ctx.beginPath(); ctx.arc(sx, sy, r * 2.8, 0, TAU);
      ctx.fillStyle = sG; ctx.fill();
    });
  }
}

// ── Decorative corner ornament ────────────────────────────────────
// An L-bracket with pearl dot accents — flipped per corner via CSS transform.
type Corner = "tl" | "tr" | "bl" | "br";
function CornerOrnament({ pos }: { pos: Corner }) {
  const sx = pos.includes("r") ? -1 : 1;
  const sy = pos.includes("b") ? -1 : 1;
  return (
    <svg
      className={`pearl-corner ${pos}`}
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden
      style={{ transform: `scale(${sx},${sy})` }}
    >
      {/* Outer L-bracket */}
      <path
        d="M5 32 L5 8 Q5 5 8 5 L32 5"
        stroke="#d4a843" strokeWidth="2.6" strokeLinecap="round"
      />
      {/* Inner shorter bracket */}
      <path
        d="M5 24 L5 12 Q5 9 8 9 L20 9"
        stroke="#d4a843" strokeWidth="1.3" strokeLinecap="round" opacity=".55"
      />
      {/* End dots */}
      <circle cx="5"  cy="32" r="3.2" fill="#d4a843" />
      <circle cx="32" cy="5"  r="3.2" fill="#d4a843" />
      {/* Corner circle + centre dot */}
      <circle cx="5" cy="5" r="5"   stroke="#d4a843" strokeWidth="2" />
      <circle cx="5" cy="5" r="2"   fill="#d4a843" />
      {/* Small mid-dot on each arm */}
      <circle cx="5"  cy="18" r="1.5" fill="#d4a843" opacity=".45" />
      <circle cx="18" cy="5"  r="1.5" fill="#d4a843" opacity=".45" />
    </svg>
  );
}

// ── Canvas fallback component (Swati/Oyster myth animation) ───────
const CYCLE = 720; // frames — ≈ 12 s at 60 fps

function OysterCanvas({ hidden }: { hidden: boolean }) {
  const cvRef    = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef   = useRef(0);
  const dropsRef = useRef<Drop[]>([]);
  const dprRef   = useRef(1);
  const sizeRef  = useRef({ W: 0, H: 0 });

  useEffect(() => {
    if (hidden) return; // stop drawing once video is playing
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const el = cv.parentElement ?? cv;
      const rect = el.getBoundingClientRect();
      const W = rect.width, H = rect.height;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      dprRef.current = dpr;
      sizeRef.current = { W, H };
      cv.width  = W * dpr;
      cv.height = H * dpr;
      cv.style.width  = `${W}px`;
      cv.style.height = `${H}px`;
      dropsRef.current = mkDrops(W, H);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv.parentElement ?? cv);

    let alive = true;
    const loop = () => {
      if (!alive) return;
      const { W, H } = sizeRef.current;
      const p = (frameRef.current % CYCLE) / CYCLE;
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      render(ctx, W, H, p, dropsRef.current, frameRef.current);

      for (const d of dropsRef.current) {
        d.y += d.spd; d.x -= d.spd * 0.17;
        if (d.y - d.len > H * 0.57 || d.x < -40) {
          d.y = -d.len - Math.random() * H * 0.18;
          d.x = Math.random() * W;
        }
      }

      frameRef.current++;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [hidden]);

  return (
    <canvas
      ref={cvRef}
      style={{
        display: "block", position: "absolute", inset: 0,
        transition: "opacity 0.8s ease",
        opacity: hidden ? 0 : 1,
      }}
    />
  );
}

// ── Main banner component ─────────────────────────────────────────
export function KalyanBanner({
  intensity = "hero",
}: {
  intensity?: "hero" | "wash";
  presentation?: "cover" | "complete";
  veil?: boolean;
}) {
  // Track whether the video has started playing
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlaying = () => setVideoPlaying(true);
    const onError   = () => setVideoPlaying(false);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error",   onError);
    if (!v.paused && v.readyState >= 3) setVideoPlaying(true);
    return () => {
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error",   onError);
    };
  }, []);

  const wash = intensity === "wash";
  return (
    <>
      {/* ── Video frame ── */}
      <div
        className={`lotus-lake${wash ? " is-wash" : " is-hero"}`}
        aria-hidden
        style={wash ? { opacity: 0.25, filter: "saturate(0.6)" } : undefined}
      >
        {/* Canvas fallback — plays until video is ready */}
        <OysterCanvas hidden={videoPlaying} />

        {/* Video — primary, fades in once playing.
            poster: solid-black 1×1 prevents any cached-frame flash before play. */}
        <video
          ref={videoRef}
          src="/banner.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            transition: "opacity 0.8s ease",
            opacity: videoPlaying ? 1 : 0,
          }}
        />
      </div>

      {/* ── Decorative corner ornaments (sit in the mat gap, above the frame) ── */}
      {!wash && (
        <>
          <CornerOrnament pos="tl" />
          <CornerOrnament pos="tr" />
          <CornerOrnament pos="bl" />
          <CornerOrnament pos="br" />
        </>
      )}
    </>
  );
}
