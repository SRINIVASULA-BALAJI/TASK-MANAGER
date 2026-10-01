/* ============================================================
   BG.JS v2 — Christopher Nolan Cinematic Engine
   Wormhole | Black Hole | Gravitational Lensing | Parallax
   Stars | Aurora | God Rays | Fog | Meteors | Particle Net
   ============================================================ */
(function () {
  'use strict';

  let bgC, bgX, aurC, aurX, fogC, fogX;
  let W = 0, H = 0, frame = 0;
  let mouseX = 0.5, mouseY = 0.5; // normalized

  const stars = [], shooters = [], aurora = [], fog = [], nets = [];

  /* ── WORMHOLE STATE ──────────────────────────────────────── */
  const WH = {
    x: 0, y: 0,       // set in resize
    outerR: 0,         // set in resize
    innerR: 0,
    rotation: 0,
    rings: [],
    lensStars: [],     // stars that bend around wormhole
    accretionAlpha: 0,
    pulse: 0,
  };

  /* ── RESIZE ──────────────────────────────────────────────── */
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    [bgC, aurC, fogC].forEach(c => { if (c) { c.width = W; c.height = H; } });
    // Wormhole at upper-right area
    WH.x = W * 0.78; WH.y = H * 0.22;
    WH.outerR = Math.min(W, H) * 0.14;
    WH.innerR = WH.outerR * 0.38;
  }

  /* ── INIT ────────────────────────────────────────────────── */
  function init() {
    bgC  = document.getElementById('bgCanvas');
    aurC = document.getElementById('auroraCanvas');
    fogC = document.getElementById('fogCanvas');
    if (!bgC) { setTimeout(init, 80); return; }
    bgX  = bgC.getContext('2d');
    aurX = aurC ? aurC.getContext('2d') : null;
    fogX = fogC ? fogC.getContext('2d') : null;
    resize();
    window.addEventListener('resize', resize);

    // Mouse parallax
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX / W;
      mouseY = e.clientY / H;
    });

    buildStars(); buildShooters(); buildAurora(); buildFog(); buildNets(); buildWormhole();
    tick();
  }

  /* ── STARS (with parallax layers) ───────────────────────── */
  function buildStars() {
    const cols = ['#ffffff','#ede9fe','#c4b5fd','#bae6fd','#a5f3fc','#fdf4ff','#fef3c7'];
    for (let i = 0; i < 320; i++) {
      const layer = Math.floor(Math.random() * 3); // 0=far,1=mid,2=near
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        bx: Math.random() * W, by: Math.random() * H, // base position
        r: (0.2 + layer * 0.7) + Math.random() * 0.8,
        a: Math.random() * 0.7 + 0.2,
        phase: Math.random() * Math.PI * 2,
        spd: Math.random() * 0.016 + 0.004,
        col: cols[Math.floor(Math.random() * cols.length)],
        layer: layer,                  // parallax depth
        parallax: (layer + 1) * 5,    // px shift multiplier
      });
    }
  }

  function drawStars() {
    stars.forEach(s => {
      s.phase += s.spd;
      // Parallax offset
      const px = (mouseX - 0.5) * s.parallax;
      const py = (mouseY - 0.5) * s.parallax;
      const sx = s.bx + px;
      const sy = s.by + py;

      // Wrap edges
      const wx = ((sx % W) + W) % W;
      const wy = ((sy % H) + H) % H;

      // Gravitational lensing: stars bend around wormhole
      const dx = wx - WH.x, dy = wy - WH.y;
      const dist = Math.hypot(dx, dy);
      let lx = wx, ly = wy;
      if (dist < WH.outerR * 3 && dist > WH.innerR) {
        const pull = (WH.outerR * 2) / (dist * dist) * 18;
        lx += (dx / dist) * -pull;
        ly += (dy / dist) * -pull;
      }

      // Skip stars inside black hole
      if (Math.hypot(lx - WH.x, ly - WH.y) < WH.innerR * 0.9) return;

      const a = s.a * (0.5 + 0.5 * Math.sin(s.phase));
      const r = s.r * (0.85 + 0.15 * Math.sin(s.phase * 1.4));

      // Glow halo
      const g = bgX.createRadialGradient(lx, ly, 0, lx, ly, r * 7);
      g.addColorStop(0, s.col + 'aa'); g.addColorStop(1, 'transparent');
      bgX.beginPath(); bgX.arc(lx, ly, r * 7, 0, Math.PI * 2); bgX.fillStyle = g; bgX.fill();
      // Core
      bgX.beginPath(); bgX.arc(lx, ly, r, 0, Math.PI * 2);
      bgX.fillStyle = s.col; bgX.globalAlpha = a; bgX.fill(); bgX.globalAlpha = 1;
    });
  }

  /* ── WORMHOLE / BLACK HOLE ───────────────────────────────── */
  function buildWormhole() {
    // Accretion disk rings
    WH.rings = [];
    for (let i = 0; i < 6; i++) {
      WH.rings.push({
        r: WH.innerR * (1.4 + i * 0.55),
        width: 3 + i * 1.5,
        speed: 0.008 - i * 0.001,
        phase: Math.random() * Math.PI * 2,
        color: i < 2
          ? `rgba(251,191,36,`
          : i < 4
            ? `rgba(251,146,60,`
            : `rgba(239,68,68,`,
        opacity: 0.7 - i * 0.1,
      });
    }
  }

  function drawWormhole() {
    WH.rotation += 0.004;
    WH.pulse    += 0.025;
    WH.accretionAlpha = 0.75 + 0.25 * Math.sin(WH.pulse);

    bgX.save();
    bgX.translate(WH.x, WH.y);

    // ── Deep void (black hole) ──
    const voidG = bgX.createRadialGradient(0, 0, 0, 0, 0, WH.innerR);
    voidG.addColorStop(0, '#000000');
    voidG.addColorStop(0.7, '#000308');
    voidG.addColorStop(1, 'rgba(0,3,8,0)');
    bgX.beginPath(); bgX.arc(0, 0, WH.innerR, 0, Math.PI * 2);
    bgX.fillStyle = voidG; bgX.fill();

    // ── Photon sphere glow ──
    const psG = bgX.createRadialGradient(0, 0, WH.innerR * 0.9, 0, 0, WH.innerR * 1.3);
    psG.addColorStop(0, 'rgba(147,197,253,0.0)');
    psG.addColorStop(0.5, 'rgba(147,197,253,0.25)');
    psG.addColorStop(1, 'rgba(147,197,253,0)');
    bgX.beginPath(); bgX.arc(0, 0, WH.innerR * 1.3, 0, Math.PI * 2);
    bgX.fillStyle = psG; bgX.fill();

    // ── Accretion disk rings ──
    bgX.save();
    bgX.rotate(WH.rotation);
    bgX.scale(1, 0.32); // flatten to ellipse (viewing angle)
    WH.rings.forEach(rg => {
      rg.phase += rg.speed;
      const op = rg.opacity * WH.accretionAlpha;
      // Main ring arc
      const grad = bgX.createConicalGradient
        ? null
        : null; // fallback
      bgX.beginPath();
      bgX.arc(0, 0, rg.r, 0, Math.PI * 2);
      bgX.strokeStyle = rg.color + op + ')';
      bgX.lineWidth   = rg.width;
      bgX.shadowBlur  = rg.width * 4;
      bgX.shadowColor = rg.color + '0.6)';
      bgX.stroke();
      bgX.shadowBlur = 0;
    });
    bgX.restore();

    // ── Relativistic jet ──
    for (let side = -1; side <= 1; side += 2) {
      const jetG = bgX.createLinearGradient(0, 0, 0, side * WH.outerR * 4);
      jetG.addColorStop(0, 'rgba(147,197,253,0.6)');
      jetG.addColorStop(0.3, 'rgba(147,197,253,0.15)');
      jetG.addColorStop(1, 'rgba(147,197,253,0)');
      bgX.beginPath();
      bgX.moveTo(-4, 0); bgX.lineTo(4, 0);
      bgX.lineTo(2, side * WH.outerR * 4); bgX.lineTo(-2, side * WH.outerR * 4);
      bgX.closePath();
      bgX.fillStyle = jetG; bgX.fill();
    }

    // ── Outer lensing halo ──
    const lensG = bgX.createRadialGradient(0, 0, WH.outerR * 0.8, 0, 0, WH.outerR * 2.5);
    lensG.addColorStop(0, 'rgba(176,158,255,0.12)');
    lensG.addColorStop(0.5, 'rgba(96,199,255,0.04)');
    lensG.addColorStop(1, 'rgba(0,0,0,0)');
    bgX.beginPath(); bgX.arc(0, 0, WH.outerR * 2.5, 0, Math.PI * 2);
    bgX.fillStyle = lensG; bgX.fill();

    // ── Interstellar dust ring (spinning debris) ──
    bgX.save();
    bgX.rotate(-WH.rotation * 0.6);
    bgX.scale(1, 0.2);
    for (let i = 0; i < 120; i++) {
      const angle = (i / 120) * Math.PI * 2 + WH.rotation * 0.5;
      const r = WH.outerR * (0.9 + Math.random() * 0.4);
      const dx = Math.cos(angle) * r;
      const dy = Math.sin(angle) * r;
      bgX.beginPath(); bgX.arc(dx, dy, Math.random() * 1.2 + 0.3, 0, Math.PI * 2);
      bgX.fillStyle = `rgba(251,191,36,${Math.random() * 0.4 + 0.1})`;
      bgX.fill();
    }
    bgX.restore();

    bgX.restore();
  }

  /* ── SHOOTING STARS ──────────────────────────────────────── */
  function mkShooter(init) {
    const ang = (Math.random() * 45 + 20) * Math.PI / 180;
    return {
      x: Math.random() * W, y: init ? Math.random() * H * 0.5 : -80,
      vx: Math.cos(ang) * (Math.random() * 12 + 6),
      vy: Math.sin(ang) * (Math.random() * 12 + 6),
      len: Math.random() * 180 + 80,
      alpha: 0, maxAlpha: Math.random() * 0.8 + 0.3,
      fadeIn: true, delay: Math.floor(Math.random() * 300)
    };
  }
  function buildShooters() {
    for (let i = 0; i < 7; i++) shooters.push(mkShooter(true));
  }
  function drawShooters() {
    shooters.forEach((s, i) => {
      if (s.delay > 0) { s.delay--; return; }
      s.x += s.vx; s.y += s.vy;
      if (s.fadeIn) { s.alpha = Math.min(s.alpha + 0.07, s.maxAlpha); if (s.alpha >= s.maxAlpha) s.fadeIn = false; }
      else { s.alpha = Math.max(s.alpha - 0.025, 0); }
      if (s.alpha <= 0 || s.x > W + 150 || s.y > H + 150) { shooters[i] = mkShooter(false); return; }
      const spd = Math.hypot(s.vx, s.vy);
      const tx = s.x - s.vx * (s.len / spd), ty = s.y - s.vy * (s.len / spd);
      const gr = bgX.createLinearGradient(tx, ty, s.x, s.y);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.6, `rgba(220,200,255,${s.alpha * 0.5})`);
      gr.addColorStop(1, `rgba(255,255,255,${s.alpha})`);
      bgX.beginPath(); bgX.moveTo(tx, ty); bgX.lineTo(s.x, s.y);
      bgX.strokeStyle = gr; bgX.lineWidth = 2.2; bgX.stroke();
      const hg = bgX.createRadialGradient(s.x, s.y, 0, s.x, s.y, 9);
      hg.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
      hg.addColorStop(0.5, `rgba(176,158,255,${s.alpha * 0.5})`);
      hg.addColorStop(1, 'transparent');
      bgX.beginPath(); bgX.arc(s.x, s.y, 9, 0, Math.PI * 2); bgX.fillStyle = hg; bgX.fill();
    });
  }

  /* ── AURORA ──────────────────────────────────────────────── */
  function buildAurora() {
    const cols = ['rgba(124,58,237,','rgba(99,102,241,','rgba(37,99,235,','rgba(16,185,129,','rgba(168,85,247,'];
    for (let i = 0; i < 5; i++) {
      aurora.push({
        y: H * (0.03 + i * 0.05), amp: 50 + Math.random() * 70,
        wl: 0.0028 + Math.random() * 0.003, spd: 0.0022 + Math.random() * 0.004,
        phase: Math.random() * Math.PI * 2, col: cols[i],
        op: 0.1 + Math.random() * 0.2, w: 80 + Math.random() * 100,
        pp: Math.random() * Math.PI * 2, ps: 0.005 + Math.random() * 0.01,
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
      gr.addColorStop(0, b.col + '0)'); gr.addColorStop(0.3, b.col + (op * 0.5) + ')');
      gr.addColorStop(0.5, b.col + op + ')'); gr.addColorStop(0.7, b.col + (op * 0.5) + ')'); gr.addColorStop(1, b.col + '0)');
      aurX.beginPath(); aurX.moveTo(0, b.y);
      for (let x = 0; x <= W; x += 5) {
        const y = b.y + Math.sin(x * b.wl + b.phase) * b.amp + Math.sin(x * b.wl * 2.5 + b.phase * 0.65) * (b.amp * 0.3);
        aurX.lineTo(x, y);
      }
      aurX.lineTo(W, b.y + b.w * 2.2); aurX.lineTo(0, b.y + b.w * 2.2); aurX.closePath();
      aurX.fillStyle = gr; aurX.fill();
    });
  }

  /* ── VOLUMETRIC FOG ──────────────────────────────────────── */
  function buildFog() {
    const fcols = ['rgba(124,58,237,', 'rgba(37,99,235,', 'rgba(16,185,129,', 'rgba(109,40,217,'];
    for (let i = 0; i < 22; i++) {
      fog.push({
        x: Math.random() * W, y: Math.random() * H, r: Math.random() * 180 + 80,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.09,
        op: Math.random() * 0.038 + 0.01,
        col: fcols[Math.floor(Math.random() * fcols.length)],
        phase: Math.random() * Math.PI * 2, ps: 0.003 + Math.random() * 0.005,
      });
    }
  }
  function drawFog() {
    if (!fogX) return;
    fogX.clearRect(0, 0, W, H);
    fog.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.phase += p.ps;
      if (p.x < -p.r * 2) p.x = W + p.r; if (p.x > W + p.r * 2) p.x = -p.r;
      if (p.y < -p.r * 2) p.y = H + p.r; if (p.y > H + p.r * 2) p.y = -p.r;
      const op = p.op * (0.65 + 0.35 * Math.sin(p.phase));
      fogX.shadowBlur = 80; fogX.shadowColor = p.col + op + ')';
      const g = fogX.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.col + op + ')'); g.addColorStop(1, p.col + '0)');
      fogX.beginPath(); fogX.arc(p.x, p.y, p.r, 0, Math.PI * 2); fogX.fillStyle = g; fogX.fill();
      fogX.shadowBlur = 0;
    });
  }

  /* ── GOD RAYS ────────────────────────────────────────────── */
  function drawGodRays() {
    // From wormhole position + standard corners
    const srcs = [{ x: W * 0.06, y: -50 }, { x: W * 0.94, y: -50 }, { x: WH.x, y: WH.y }];
    srcs.forEach((src, si) => {
      const count = si === 2 ? 8 : 5;
      for (let i = 0; i < count; i++) {
        let ang;
        if (si === 2) {
          ang = (i / count) * Math.PI * 2 + frame * 0.002;
        } else {
          ang = (si === 0 ? 15 + i * 17 : 165 - i * 17) * Math.PI / 180;
        }
        const len = si === 2 ? WH.outerR * 3.5 : H * 1.7;
        const ex = src.x + Math.cos(ang) * len, ey = src.y + Math.sin(ang) * len;
        const op = si === 2
          ? (0.015 + 0.01 * Math.sin(frame * 0.015 + i)) * WH.accretionAlpha
          : 0.018 + 0.01 * Math.sin(frame * 0.009 + i * 0.8 + si * 1.4);
        const colA = si === 2 ? 'rgba(251,191,36,' : 'rgba(176,158,255,';
        const colB = si === 2 ? 'rgba(251,146,60,' : 'rgba(96,199,255,';
        const g = bgX.createLinearGradient(src.x, src.y, ex, ey);
        g.addColorStop(0, colA + op + ')');
        g.addColorStop(0.4, colB + (op * 0.6) + ')');
        g.addColorStop(1, colA + '0)');
        const spread = si === 2 ? 8 : 14;
        bgX.beginPath(); bgX.moveTo(src.x - spread, src.y);
        bgX.lineTo(ex - spread * 2, ey); bgX.lineTo(ex + spread * 2, ey); bgX.lineTo(src.x + spread, src.y);
        bgX.closePath(); bgX.fillStyle = g; bgX.fill();
      }
    });
  }

  /* ── PARTICLE NETWORK ────────────────────────────────────── */
  function buildNets() {
    const cols = ['#b09eff', '#60c7ff', '#4ade80', '#fb923c', '#818cf8', '#f0abfc'];
    for (let i = 0; i < 65; i++) {
      nets.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2.4 + 0.4, a: Math.random() * 0.4 + 0.1,
        col: cols[Math.floor(Math.random() * cols.length)],
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }
  function drawNets() {
    nets.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.pulse += 0.016;
      if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
      for (let j = i + 1; j < nets.length; j++) {
        const dx = p.x - nets[j].x, dy = p.y - nets[j].y, d = Math.hypot(dx, dy);
        if (d < 130) { bgX.beginPath(); bgX.strokeStyle = 'rgba(176,158,255,' + (0.07 * (1 - d / 130)) + ')'; bgX.lineWidth = 0.5; bgX.moveTo(p.x, p.y); bgX.lineTo(nets[j].x, nets[j].y); bgX.stroke(); }
      }
      const r = p.r + Math.sin(p.pulse) * 0.4;
      const g = bgX.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
      g.addColorStop(0, p.col + '55'); g.addColorStop(1, 'transparent');
      bgX.beginPath(); bgX.arc(p.x, p.y, r * 5, 0, Math.PI * 2); bgX.fillStyle = g; bgX.fill();
      bgX.beginPath(); bgX.arc(p.x, p.y, r, 0, Math.PI * 2);
      bgX.fillStyle = p.col; bgX.globalAlpha = p.a + Math.sin(p.pulse) * 0.05; bgX.fill(); bgX.globalAlpha = 1;
    });
  }

  /* ── ANIMATION LOOP ──────────────────────────────────────── */
  function tick() {
    frame++;
    bgX.clearRect(0, 0, W, H);
    drawGodRays();
    drawStars();
    drawShooters();
    drawNets();
    drawWormhole();
    drawAurora();
    drawFog();
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.CinematicBG = { init };
})();