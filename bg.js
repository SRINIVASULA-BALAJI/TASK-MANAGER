/* ============================================================
   TASKMASTER bg.js - Cinematic Background Engine v1.0
   Stars | Aurora | God Rays | Fog | Particle Net | Meteors
   ============================================================ */
(function () {
  'use strict';

  let bgC, bgX, aurC, aurX, fogC, fogX;
  let W = 0, H = 0, frame = 0;
  const stars = [], shooters = [], aurora = [], fog = [], nets = [];

  /* ─── RESIZE ──────────────────────────────────────────── */
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    [bgC, aurC, fogC].forEach(c => { if (c) { c.width = W; c.height = H; } });
  }

  /* ─── INIT ────────────────────────────────────────────── */
  function init() {
    bgC   = document.getElementById('bgCanvas');
    aurC  = document.getElementById('auroraCanvas');
    fogC  = document.getElementById('fogCanvas');
    if (!bgC) { setTimeout(init, 80); return; }
    bgX   = bgC.getContext('2d');
    aurX  = aurC ? aurC.getContext('2d') : null;
    fogX  = fogC ? fogC.getContext('2d') : null;
    resize();
    window.addEventListener('resize', resize);
    buildStars(); buildShooters(); buildAurora(); buildFog(); buildNets();
    tick();
  }

  /* ─── STARS ───────────────────────────────────────────── */
  function buildStars() {
    const cols = ['#ffffff','#ede9fe','#c4b5fd','#bae6fd','#a5f3fc','#fdf4ff'];
    for (let i = 0; i < 230; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.9 + 0.25,
        a: Math.random() * 0.75 + 0.2,
        phase: Math.random() * Math.PI * 2,
        spd: Math.random() * 0.02 + 0.004,
        col: cols[Math.floor(Math.random() * cols.length)],
      });
    }
  }

  function drawStars() {
    stars.forEach(s => {
      s.phase += s.spd;
      const a = s.a * (0.5 + 0.5 * Math.sin(s.phase));
      const r = s.r * (0.88 + 0.12 * Math.sin(s.phase * 1.4));
      /* glow halo */
      const g = bgX.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 7);
      g.addColorStop(0, hexToRgba(s.col, a * 0.45));
      g.addColorStop(1, 'transparent');
      bgX.beginPath(); bgX.arc(s.x, s.y, r * 7, 0, Math.PI * 2);
      bgX.fillStyle = g; bgX.fill();
      /* core */
      bgX.beginPath(); bgX.arc(s.x, s.y, r, 0, Math.PI * 2);
      bgX.fillStyle = s.col; bgX.globalAlpha = a; bgX.fill(); bgX.globalAlpha = 1;
    });
  }

  /* ─── SHOOTING STARS ──────────────────────────────────── */
  function mkShooter(initial) {
    const ang = (Math.random() * 45 + 20) * Math.PI / 180;
    return {
      x: Math.random() * W, y: initial ? Math.random() * H * 0.6 : -80,
      vx: Math.cos(ang) * (Math.random() * 10 + 5),
      vy: Math.sin(ang) * (Math.random() * 10 + 5),
      len: Math.random() * 150 + 60,
      alpha: 0, maxAlpha: Math.random() * 0.7 + 0.28,
      fadeIn: true, delay: Math.floor(Math.random() * 320),
    };
  }
  function buildShooters() {
    for (let i = 0; i < 6; i++) shooters.push(mkShooter(true));
  }
  function drawShooters() {
    shooters.forEach((s, i) => {
      if (s.delay > 0) { s.delay--; return; }
      s.x += s.vx; s.y += s.vy;
      if (s.fadeIn) {
        s.alpha = Math.min(s.alpha + 0.06, s.maxAlpha);
        if (s.alpha >= s.maxAlpha) s.fadeIn = false;
      } else {
        s.alpha = Math.max(s.alpha - 0.025, 0);
      }
      if (s.alpha <= 0 || s.x > W + 120 || s.y > H + 120) {
        shooters[i] = mkShooter(false); return;
      }
      const spd = Math.hypot(s.vx, s.vy);
      const tx = s.x - s.vx * (s.len / spd);
      const ty = s.y - s.vy * (s.len / spd);
      const gr = bgX.createLinearGradient(tx, ty, s.x, s.y);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.6, 'rgba(200,185,255,' + (s.alpha * 0.45) + ')');
      gr.addColorStop(1, 'rgba(255,255,255,' + s.alpha + ')');
      bgX.beginPath(); bgX.moveTo(tx, ty); bgX.lineTo(s.x, s.y);
      bgX.strokeStyle = gr; bgX.lineWidth = 2; bgX.stroke();
      /* head glow */
      const hg = bgX.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8);
      hg.addColorStop(0, 'rgba(255,255,255,' + s.alpha + ')');
      hg.addColorStop(0.5, 'rgba(176,158,255,' + (s.alpha * 0.5) + ')');
      hg.addColorStop(1, 'transparent');
      bgX.beginPath(); bgX.arc(s.x, s.y, 8, 0, Math.PI * 2);
      bgX.fillStyle = hg; bgX.fill();
    });
  }

  /* ─── AURORA BOREALIS ─────────────────────────────────── */
  function buildAurora() {
    const cols = [
      'rgba(124,58,237,', 'rgba(99,102,241,', 'rgba(37,99,235,',
      'rgba(16,185,129,', 'rgba(168,85,247,'
    ];
    for (let i = 0; i < 5; i++) {
      aurora.push({
        y: H * (0.04 + i * 0.055),
        amp: 45 + Math.random() * 65,
        wl: 0.0028 + Math.random() * 0.0032,
        spd: 0.0025 + Math.random() * 0.0045,
        phase: Math.random() * Math.PI * 2,
        col: cols[i],
        op: 0.12 + Math.random() * 0.22,
        w: 75 + Math.random() * 95,
        pp: Math.random() * Math.PI * 2,
        ps: 0.006 + Math.random() * 0.011,
      });
    }
  }
  function drawAurora() {
    if (!aurX) return;
    aurX.clearRect(0, 0, W, H);
    aurora.forEach(b => {
      b.phase += b.spd; b.pp += b.ps;
      const op = b.op * (0.6 + 0.4 * Math.sin(b.pp));
      const gr = aurX.createLinearGradient(0, b.y - b.w, 0, b.y + b.w);
      gr.addColorStop(0, b.col + '0)');
      gr.addColorStop(0.28, b.col + (op * 0.5) + ')');
      gr.addColorStop(0.5, b.col + op + ')');
      gr.addColorStop(0.72, b.col + (op * 0.5) + ')');
      gr.addColorStop(1, b.col + '0)');
      aurX.beginPath(); aurX.moveTo(0, b.y);
      for (let x = 0; x <= W; x += 6) {
        const y = b.y
          + Math.sin(x * b.wl + b.phase) * b.amp
          + Math.sin(x * b.wl * 2.5 + b.phase * 0.6) * (b.amp * 0.3);
        aurX.lineTo(x, y);
      }
      aurX.lineTo(W, b.y + b.w * 2.2);
      aurX.lineTo(0, b.y + b.w * 2.2);
      aurX.closePath();
      aurX.fillStyle = gr; aurX.fill();
    });
  }

  /* ─── VOLUMETRIC FOG ──────────────────────────────────── */
  function buildFog() {
    const fcols = ['rgba(124,58,237,','rgba(37,99,235,','rgba(16,185,129,','rgba(109,40,217,'];
    for (let i = 0; i < 20; i++) {
      fog.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 170 + 75,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.1,
        op: Math.random() * 0.042 + 0.012,
        col: fcols[Math.floor(Math.random() * fcols.length)],
        phase: Math.random() * Math.PI * 2,
        ps: 0.003 + Math.random() * 0.006,
      });
    }
  }
  function drawFog() {
    if (!fogX) return;
    fogX.clearRect(0, 0, W, H);
    fog.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.phase += p.ps;
      if (p.x < -p.r * 2) p.x = W + p.r;
      if (p.x > W + p.r * 2) p.x = -p.r;
      if (p.y < -p.r * 2) p.y = H + p.r;
      if (p.y > H + p.r * 2) p.y = -p.r;
      const op = p.op * (0.65 + 0.35 * Math.sin(p.phase));
      fogX.shadowBlur = 80; fogX.shadowColor = p.col + op + ')';
      const g = fogX.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.col + op + ')');
      g.addColorStop(1, p.col + '0)');
      fogX.beginPath(); fogX.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      fogX.fillStyle = g; fogX.fill();
      fogX.shadowBlur = 0;
    });
  }

  /* ─── GOD RAYS ────────────────────────────────────────── */
  function drawGodRays() {
    const srcs = [{ x: W * 0.06, y: -50 }, { x: W * 0.94, y: -50 }];
    srcs.forEach((src, si) => {
      for (let i = 0; i < 5; i++) {
        const ang = (si === 0 ? 15 + i * 17 : 165 - i * 17) * Math.PI / 180;
        const len = H * 1.7;
        const ex = src.x + Math.cos(ang) * len;
        const ey = src.y + Math.sin(ang) * len;
        const op = 0.02 + 0.014 * Math.sin(frame * 0.009 + i * 0.8 + si * 1.4);
        const g = bgX.createLinearGradient(src.x, src.y, ex, ey);
        g.addColorStop(0, 'rgba(176,158,255,' + op + ')');
        g.addColorStop(0.4, 'rgba(96,199,255,' + (op * 0.65) + ')');
        g.addColorStop(1, 'rgba(176,158,255,0)');
        bgX.beginPath();
        bgX.moveTo(src.x - 14, src.y);
        bgX.lineTo(ex - 25, ey);
        bgX.lineTo(ex + 25, ey);
        bgX.lineTo(src.x + 14, src.y);
        bgX.closePath();
        bgX.fillStyle = g; bgX.fill();
      }
    });
  }

  /* ─── PARTICLE NETWORK ────────────────────────────────── */
  function buildNets() {
    const cols = ['#b09eff','#60c7ff','#4ade80','#fb923c','#818cf8','#f0abfc'];
    for (let i = 0; i < 58; i++) {
      nets.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.38, vy: (Math.random() - 0.5) * 0.38,
        r: Math.random() * 2.2 + 0.4,
        a: Math.random() * 0.42 + 0.1,
        col: cols[Math.floor(Math.random() * cols.length)],
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }
  function drawNets() {
    nets.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.pulse += 0.016;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      /* connections */
      for (let j = i + 1; j < nets.length; j++) {
        const dx = p.x - nets[j].x, dy = p.y - nets[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 128) {
          bgX.beginPath();
          bgX.strokeStyle = 'rgba(176,158,255,' + (0.08 * (1 - d / 128)) + ')';
          bgX.lineWidth = 0.55;
          bgX.moveTo(p.x, p.y); bgX.lineTo(nets[j].x, nets[j].y); bgX.stroke();
        }
      }
      /* glow */
      const r = p.r + Math.sin(p.pulse) * 0.4;
      const g = bgX.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
      g.addColorStop(0, p.col + '55'); g.addColorStop(1, 'transparent');
      bgX.beginPath(); bgX.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
      bgX.fillStyle = g; bgX.fill();
      /* core */
      bgX.beginPath(); bgX.arc(p.x, p.y, r, 0, Math.PI * 2);
      bgX.fillStyle = p.col; bgX.globalAlpha = p.a + Math.sin(p.pulse) * 0.05;
      bgX.fill(); bgX.globalAlpha = 1;
    });
  }

  /* ─── UTIL ────────────────────────────────────────────── */
  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /* ─── ANIMATION LOOP ──────────────────────────────────── */
  function tick() {
    frame++;
    bgX.clearRect(0, 0, W, H);
    drawGodRays();
    drawStars();
    drawShooters();
    drawNets();
    drawAurora();
    drawFog();
    requestAnimationFrame(tick);
  }

  /* ─── AUTO-INIT ───────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CinematicBG = { init };
})();