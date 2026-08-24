import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { COLORS, DRINKS, REACTIONS } from "./theme";

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffff;
  return h;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ---------- background & table ----------
function drawBackground(ctx, w, h) {
  // wall (upper) + wooden floor (lower)
  const wallH = h * 0.42;
  ctx.fillStyle = "#E7D3B3";
  ctx.fillRect(0, 0, w, wallH);
  // subtle wall panels
  ctx.strokeStyle = "rgba(139,90,43,0.18)";
  ctx.lineWidth = 2;
  for (let x = 60; x < w; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, wallH);
    ctx.stroke();
  }
  // window glow
  const grd = ctx.createRadialGradient(w * 0.16, wallH * 0.5, 20, w * 0.16, wallH * 0.5, 220);
  grd.addColorStop(0, "rgba(255,240,200,0.9)");
  grd.addColorStop(1, "rgba(255,240,200,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, wallH);

  // floor
  ctx.fillStyle = COLORS.wood;
  ctx.fillRect(0, wallH, w, h - wallH);
  ctx.strokeStyle = "rgba(62,39,35,0.10)";
  ctx.lineWidth = 2;
  for (let y = wallH + 30; y < h; y += 46) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // warm vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(62,39,35,0.22)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function drawTable(ctx, cx, cy, rx, ry) {
  // shadow
  ctx.fillStyle = "rgba(62,39,35,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, rx + 16, ry + 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // table side
  ctx.fillStyle = COLORS.woodDark;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  // table top
  ctx.fillStyle = "#C79A63";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 4;
  ctx.stroke();
  // wood grain rings
  ctx.strokeStyle = "rgba(62,39,35,0.14)";
  ctx.lineWidth = 2;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * (i / 4), ry * (i / 4), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // a little candle in the middle
  ctx.fillStyle = "#FFF4D6";
  roundRect(ctx, cx - 8, cy - 16, 16, 22, 4);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2;
  ctx.stroke();
  const flick = 4 + Math.sin(Date.now() / 120) * 1.5;
  ctx.fillStyle = "#FFB300";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 20, 3, flick, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,200,80,0.5)";
  ctx.beginPath();
  ctx.arc(cx, cy - 20, flick + 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawSteam(ctx, x, y, t, intensity = 1) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const off = i * 0.9;
    const prog = ((t * 0.6 + off) % 2) / 2;
    const yy = y - prog * 46;
    const alpha = (1 - prog) * 0.5 * intensity;
    const sway = Math.sin((t + off) * 2) * 6;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + i * 5 - 5, y);
    ctx.quadraticCurveTo(x + sway + i * 5 - 5, yy + 20, x + i * 5 - 5, yy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCup(ctx, x, y, s, drink) {
  const d = DRINKS[drink] || DRINKS.chai;
  ctx.save();
  // cup body
  ctx.fillStyle = d.cup;
  roundRect(ctx, x - 11 * s, y - 12 * s, 22 * s, 22 * s, 5 * s);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();
  // liquid top
  ctx.fillStyle = d.liquid;
  ctx.beginPath();
  ctx.ellipse(x, y - 12 * s, 9 * s, 3.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // handle
  ctx.beginPath();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2.5 * s;
  ctx.arc(x + 13 * s, y - 1 * s, 6 * s, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // boba pearls
  if (drink === "boba") {
    ctx.fillStyle = "#2B1B15";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(x + i * 5 * s, y + 5 * s, 2.4 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // straw
    ctx.strokeStyle = "#EC407A";
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(x + 4 * s, y - 12 * s);
    ctx.lineTo(x + 9 * s, y - 26 * s);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawAvatar(ctx, pos, user, st, t) {
  const { x, y, s } = pos;
  const av = user.avatar || {};
  const phase = hash(user.id) % 100;
  const bob = Math.sin(t * 1.8 + phase) * 3 * s;
  const leanDir = pos.leanDir || 0;

  // action progress
  const now = t;
  const dP = st.drinkStart ? Math.max(0, 1 - Math.abs(((now - st.drinkStart) / 1.6) - 0.5) * 2) : 0;
  const drinkActive = st.drinkStart && now - st.drinkStart < 1.6;
  const cheersP = st.cheersStart && now - st.cheersStart < 1.4 ? easeInOut(Math.min(1, (now - st.cheersStart) / 0.4)) * (now - st.cheersStart < 1.0 ? 1 : (1.4 - (now - st.cheersStart)) / 0.4) : 0;
  const waveActive = st.waveStart && now - st.waveStart < 1.6;
  const wavePhase = waveActive ? Math.sin((now - st.waveStart) * 14) : 0;
  const steamBoost = (st.steamStart && now - st.steamStart < 3) ? 2.2 : 0;

  ctx.save();
  ctx.translate(x, y + bob);

  // shadow
  ctx.fillStyle = "rgba(62,39,35,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 16 * s, 40 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // cushion / stool
  ctx.fillStyle = COLORS.warmBrown;
  roundRect(ctx, -34 * s, 2 * s, 68 * s, 18 * s, 8 * s);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();

  // highlight ring for "me"
  if (user.isMe) {
    ctx.strokeStyle = COLORS.chaiOrange;
    ctx.lineWidth = 4 * s;
    ctx.setLineDash([8 * s, 6 * s]);
    ctx.beginPath();
    ctx.ellipse(0, 8 * s, 46 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const cheersLean = cheersP * 4 * leanDir;
  ctx.translate(cheersLean, -cheersP * 3);

  // torso
  ctx.fillStyle = av.outfitColor || COLORS.chaiOrange;
  roundRect(ctx, -28 * s, -46 * s, 56 * s, 62 * s, 18 * s);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 3 * s;
  ctx.stroke();
  // collar
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  roundRect(ctx, -12 * s, -48 * s, 24 * s, 10 * s, 5 * s);
  ctx.fill();

  const skin = av.head === "human" ? (av.skinTone || "#F1C9A5") : (av.furColor || "#D7A86E");

  // left arm (rest)
  ctx.strokeStyle = skin;
  ctx.lineWidth = 11 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-22 * s, -34 * s);
  ctx.lineTo(-26 * s, -8 * s);
  ctx.stroke();

  // right hand target
  let hx = 24 * s, hy = -6 * s;
  if (waveActive) {
    hx = 30 * s + wavePhase * 4 * s;
    hy = -78 * s;
  } else if (cheersP > 0.05) {
    hx = 20 * s;
    hy = -82 * s;
  } else if (drinkActive) {
    hx = lerp(24 * s, 6 * s, dP);
    hy = lerp(-6 * s, -60 * s, dP);
  }
  // right arm
  ctx.strokeStyle = skin;
  ctx.lineWidth = 11 * s;
  ctx.beginPath();
  ctx.moveTo(22 * s, -34 * s);
  ctx.quadraticCurveTo(30 * s, -20 * s, hx, hy);
  ctx.stroke();

  // cup in hand (hide during wave)
  if (!waveActive) {
    drawCup(ctx, hx, hy, s, user.drink);
    // steam from cup
    if (drinkActive || DRINKS[user.drink]?.steam) {
      drawSteam(ctx, hx, hy - 12 * s, t, drinkActive ? 1.2 : 0.5);
    }
  }
  if (steamBoost) {
    drawSteam(ctx, 0, -50 * s, t, steamBoost);
  }

  // head
  const headCy = -74 * s;
  const headR = 26 * s;
  // ears / hair-behind
  if (av.head === "cat") {
    ctx.fillStyle = skin;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 10 * s, headCy - 18 * s);
      ctx.lineTo(dir * 24 * s, headCy - 34 * s);
      ctx.lineTo(dir * 26 * s, headCy - 12 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COLORS.espresso;
      ctx.lineWidth = 2.5 * s;
      ctx.stroke();
      ctx.fillStyle = "#EC9AAF";
      ctx.beginPath();
      ctx.moveTo(dir * 13 * s, headCy - 18 * s);
      ctx.lineTo(dir * 21 * s, headCy - 28 * s);
      ctx.lineTo(dir * 22 * s, headCy - 15 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin;
    }
  } else if (av.head === "bear") {
    ctx.fillStyle = skin;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(dir * 18 * s, headCy - 20 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.espresso;
      ctx.lineWidth = 2.5 * s;
      ctx.stroke();
    }
  } else if (av.head === "bunny") {
    ctx.fillStyle = skin;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(dir * 12 * s, headCy - 18 * s);
      ctx.rotate(dir * 0.25);
      roundRect(ctx, -6 * s, -40 * s, 12 * s, 42 * s, 6 * s);
      ctx.fill();
      ctx.strokeStyle = COLORS.espresso;
      ctx.lineWidth = 2.5 * s;
      ctx.stroke();
      ctx.fillStyle = "#EC9AAF";
      roundRect(ctx, -3 * s, -36 * s, 6 * s, 30 * s, 3 * s);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = skin;
    }
  } else if (av.head === "human" && (av.hairStyle === "long" || av.hairStyle === "bun")) {
    // hair behind
    ctx.fillStyle = av.hairColor || "#3E2723";
    ctx.beginPath();
    ctx.arc(0, headCy + 2 * s, headR + 6 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // head circle
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, headCy, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 3 * s;
  ctx.stroke();

  // human hair front
  if (av.head === "human" && av.hairStyle !== "bald") {
    ctx.fillStyle = av.hairColor || "#3E2723";
    ctx.beginPath();
    ctx.arc(0, headCy, headR + 1.5 * s, Math.PI, Math.PI * 2);
    ctx.fill();
    if (av.hairStyle === "short") {
      roundRect(ctx, -headR, headCy - 4 * s, headR * 2, 8 * s, 4 * s);
      ctx.fill();
    }
    if (av.hairStyle === "bun") {
      ctx.beginPath();
      ctx.arc(0, headCy - headR - 6 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.espresso;
      ctx.lineWidth = 2 * s;
      ctx.stroke();
    }
  }

  // muzzle for bear
  if (av.head === "bear") {
    ctx.fillStyle = "#F0D9B5";
    ctx.beginPath();
    ctx.ellipse(0, headCy + 8 * s, 12 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.espresso;
    ctx.beginPath();
    ctx.ellipse(0, headCy + 3 * s, 3.5 * s, 2.6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // face — eyes
  const sipping = dP > 0.45;
  ctx.strokeStyle = COLORS.espresso;
  ctx.fillStyle = COLORS.espresso;
  ctx.lineWidth = 3 * s;
  ctx.lineCap = "round";
  const eyeY = headCy - 2 * s;
  for (const ex of [-9 * s, 9 * s]) {
    if (sipping || waveActive) {
      // happy closed eye ^_^
      ctx.beginPath();
      ctx.arc(ex, eyeY + 2 * s, 4 * s, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ex, eyeY, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // blush
  ctx.fillStyle = "rgba(236,64,122,0.35)";
  for (const bx of [-15 * s, 15 * s]) {
    ctx.beginPath();
    ctx.ellipse(bx, headCy + 7 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // mouth
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  if (sipping) {
    ctx.arc(0, headCy + 9 * s, 3 * s, 0, Math.PI * 2);
  } else {
    ctx.arc(0, headCy + 6 * s, 6 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();

  ctx.restore();
}

function drawLabel(ctx, pos, user, t) {
  const { x, y, s } = pos;
  const phase = hash(user.id) % 100;
  const bob = Math.sin(t * 1.8 + phase) * 3 * s;
  const d = DRINKS[user.drink] || DRINKS.chai;
  const text = `${user.name}  ${d.emoji}`;
  ctx.font = `${Math.round(15 * s)}px Fredoka, sans-serif`;
  const tw = ctx.measureText(text).width;
  const padX = 12 * s;
  const boxW = tw + padX * 2;
  const boxH = 26 * s;
  const bx = x - boxW / 2;
  const by = y + bob - 128 * s;

  ctx.fillStyle = user.isMe ? COLORS.chaiOrange : COLORS.cream;
  roundRect(ctx, bx, by, boxW, boxH, 13 * s);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();

  ctx.fillStyle = user.isMe ? "#fff" : COLORS.espresso;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, by + boxH / 2 + 1);
  ctx.textAlign = "left";
}

function drawBubble(ctx, pos, user, st, t) {
  if (!st.bubble) return;
  const age = t - st.bubble.born;
  const life = 4.5;
  if (age > life) {
    st.bubble = null;
    return;
  }
  const { x, y, s } = pos;
  const phase = hash(user.id) % 100;
  const bob = Math.sin(t * 1.8 + phase) * 3 * s;
  const alpha = age > life - 0.6 ? (life - age) / 0.6 : Math.min(1, age / 0.2);
  const rise = Math.min(1, age / 0.25);

  const txt = st.bubble.text;
  ctx.font = `${Math.round(14 * s)}px Nunito, sans-serif`;
  const maxW = 180 * s;
  const words = txt.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  const lineH = 18 * s;
  let bw = 0;
  for (const l of lines) bw = Math.max(bw, ctx.measureText(l).width);
  bw += 24 * s;
  const bh = lines.length * lineH + 16 * s;
  const bx = x - bw / 2;
  const by = y + bob - 150 * s - bh - (1 - rise) * 8 * s;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#fff";
  roundRect(ctx, bx, by, bw, bh, 14 * s);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();
  // tail
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, by + bh - 1);
  ctx.lineTo(x, by + bh + 12 * s);
  ctx.lineTo(x + 8 * s, by + bh - 1);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.espresso;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, x, by + 8 * s + i * lineH));
  ctx.textAlign = "left";
  ctx.restore();
}

function drawEmojis(ctx, pos, st, t) {
  if (!st.emojis || !st.emojis.length) return;
  const { x, y, s } = pos;
  st.emojis = st.emojis.filter((e) => t - e.born < 2);
  for (const e of st.emojis) {
    const age = t - e.born;
    const p = age / 2;
    const ey = y - 96 * s - p * 60 * s;
    const ex = x + (e.dx || 0) * s + Math.sin(age * 3 + (e.dx || 0)) * 6 * s;
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.font = `${Math.round(30 * s)}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(e.emoji, ex, ey);
    ctx.textAlign = "left";
    ctx.restore();
  }
}

function drawTyping(ctx, pos, user, st, t) {
  if (!st.typing) return;
  if (t - st.typing.born > 8) {
    st.typing = null;
    return;
  }
  const { x, y, s } = pos;
  const phase = hash(user.id) % 100;
  const bob = Math.sin(t * 1.8 + phase) * 3 * s;
  const bw = 48 * s;
  const bh = 26 * s;
  const bx = x - bw / 2;
  const by = y + bob - 150 * s - bh;
  ctx.save();
  ctx.fillStyle = "#fff";
  roundRect(ctx, bx, by, bw, bh, 13 * s);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 6 * s, by + bh - 1);
  ctx.lineTo(x, by + bh + 9 * s);
  ctx.lineTo(x + 6 * s, by + bh - 1);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = 0.35 + 0.65 * ((Math.sin(t * 6 - i * 0.9) + 1) / 2);
    ctx.globalAlpha = a;
    ctx.fillStyle = COLORS.warmBrown;
    ctx.beginPath();
    ctx.arc(x + (i - 1) * 11 * s, by + bh / 2, 3.2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawChair(ctx, seat, highlighted, t) {
  const { x, y, s } = seat;
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = "rgba(62,39,35,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, 16 * s, 34 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // backrest
  ctx.fillStyle = highlighted ? "#E8B57A" : COLORS.woodDark;
  roundRect(ctx, -22 * s, -40 * s, 44 * s, 22 * s, 8 * s);
  ctx.fill();
  ctx.strokeStyle = COLORS.espresso;
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();
  // seat cushion
  ctx.fillStyle = highlighted ? "#F0C089" : COLORS.warmBrown;
  roundRect(ctx, -30 * s, -4 * s, 60 * s, 18 * s, 8 * s);
  ctx.fill();
  ctx.stroke();
  if (highlighted) {
    const pulse = 1 + Math.sin(t * 6) * 0.08;
    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.fillStyle = COLORS.chaiOrange;
    ctx.beginPath();
    ctx.arc(0, -54 * s, 13 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.espresso;
    ctx.lineWidth = 2.5 * s;
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3 * s;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6 * s, -54 * s);
    ctx.lineTo(6 * s, -54 * s);
    ctx.moveTo(0, -60 * s);
    ctx.lineTo(0, -48 * s);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

const N_SEATS = 10;

function computeSeatLayout(w, h) {
  const cx = w / 2;
  const cy = h * 0.6;
  const rx = Math.min(w * 0.3, 430);
  const ry = rx * 0.44;
  const scaleBase = Math.min(1.15, Math.max(0.7, w / 1200));
  const seats = [];
  for (let i = 0; i < N_SEATS; i++) {
    const angle = Math.PI / 2 + (i / N_SEATS) * Math.PI * 2;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    const depth = (Math.sin(angle) + 1) / 2;
    const s = (0.8 + depth * 0.4) * scaleBase;
    seats.push({ index: i, x: px, y: py, s, sortY: py, leanDir: Math.sign(cx - px) || 1 });
  }
  return { table: { cx, cy, rx, ry }, seats };
}

function assignOccupancy(users) {
  const occupied = {};
  const unplaced = [];
  for (const u of users) {
    if (typeof u.seat === "number" && u.seat >= 0 && u.seat < N_SEATS && occupied[u.seat] === undefined) {
      occupied[u.seat] = u;
    } else {
      unplaced.push(u);
    }
  }
  let free = 0;
  for (const u of unplaced) {
    while (free < N_SEATS && occupied[free] !== undefined) free++;
    if (free < N_SEATS) occupied[free] = u;
  }
  return occupied;
}

const LoungeCanvas = forwardRef(function LoungeCanvas({ users, onPickSeat }, ref) {
  const canvasRef = useRef(null);
  const usersRef = useRef(users);
  const animRef = useRef({}); // id -> state
  const zoomRef = useRef(1);
  const mouseRef = useRef(null); // world coords {x,y}
  const seatsRef = useRef([]); // last computed seats
  const occupiedRef = useRef({});
  const hoverSeatRef = useRef(-1);
  const onPickSeatRef = useRef(onPickSeat);
  usersRef.current = users;
  onPickSeatRef.current = onPickSeat;

  const stateFor = (id) => {
    if (!animRef.current[id]) animRef.current[id] = { emojis: [] };
    return animRef.current[id];
  };

  const setZoom = (z) => {
    zoomRef.current = Math.max(0.6, Math.min(2, z));
  };

  useImperativeHandle(ref, () => ({
    triggerAction(id, action) {
      const st = stateFor(id);
      const now = performance.now() / 1000;
      if (action === "drink") st.drinkStart = now;
      else if (action === "cheers") st.cheersStart = now;
      else if (action === "steam") st.steamStart = now;
      else if (action === "wave") st.waveStart = now;
      const emoji = REACTIONS[action];
      if (emoji) st.emojis.push({ emoji, born: now, dx: (Math.random() - 0.5) * 30 });
    },
    triggerBubble(id, text) {
      const st = stateFor(id);
      st.bubble = { text, born: performance.now() / 1000 };
    },
    triggerTyping(id, active) {
      const st = stateFor(id);
      st.typing = active ? { born: performance.now() / 1000 } : null;
    },
    zoomIn() {
      setZoom(zoomRef.current + 0.2);
    },
    zoomOut() {
      setZoom(zoomRef.current - 0.2);
    },
    resetZoom() {
      setZoom(1);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const screenToWorld = (px, py) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const z = zoomRef.current;
      return { x: (px - w / 2) / z + w / 2, y: (py - h / 2) / z + h / 2 };
    };

    const nearestEmptySeat = (wx, wy) => {
      let best = -1;
      let bestD = Infinity;
      for (const seat of seatsRef.current) {
        if (occupiedRef.current[seat.index]) continue;
        const dx = wx - seat.x;
        const dy = wy - (seat.y - 20 * seat.s);
        const d = dx * dx + dy * dy;
        const thr = 60 * seat.s;
        if (d < thr * thr && d < bestD) {
          bestD = d;
          best = seat.index;
        }
      }
      return best;
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const wpt = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      mouseRef.current = wpt;
      const seat = nearestEmptySeat(wpt.x, wpt.y);
      hoverSeatRef.current = seat;
      canvas.style.cursor = seat >= 0 ? "pointer" : "default";
    };
    const onLeave = () => {
      mouseRef.current = null;
      hoverSeatRef.current = -1;
    };
    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const wpt = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const seat = nearestEmptySeat(wpt.x, wpt.y);
      if (seat >= 0) onPickSeatRef.current?.(seat);
    };
    const onWheel = (e) => {
      e.preventDefault();
      setZoom(zoomRef.current + (e.deltaY < 0 ? 0.1 : -0.1));
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const loop = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const z = zoomRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() / 1000;

      drawBackground(ctx, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(z, z);
      ctx.translate(-w / 2, -h / 2);

      const { table, seats } = computeSeatLayout(w, h);
      const occupied = assignOccupancy(usersRef.current);
      seatsRef.current = seats;
      occupiedRef.current = occupied;

      drawTable(ctx, table.cx, table.cy, table.rx, table.ry);

      const items = seats.map((seat) => ({ seat, user: occupied[seat.index] || null }));
      const sorted = [...items].sort((a, b) => a.seat.sortY - b.seat.sortY);

      for (const it of sorted) {
        if (it.user) {
          const pos = { x: it.seat.x, y: it.seat.y, s: it.seat.s, leanDir: it.seat.leanDir };
          drawAvatar(ctx, pos, it.user, stateFor(it.user.id), t);
        } else {
          drawChair(ctx, it.seat, hoverSeatRef.current === it.seat.index, t);
        }
      }
      for (const it of sorted) {
        if (!it.user) continue;
        const pos = { x: it.seat.x, y: it.seat.y, s: it.seat.s, leanDir: it.seat.leanDir };
        const st = stateFor(it.user.id);
        drawLabel(ctx, pos, it.user, t);
        drawEmojis(ctx, pos, st, t);
        drawBubble(ctx, pos, it.user, st, t);
        if (!st.bubble) drawTyping(ctx, pos, it.user, st, t);
      }

      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" data-testid="lounge-canvas" />;
});

export default LoungeCanvas;
