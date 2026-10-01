/* ============================================================
   CURSOR.JS — Christopher Nolan Cinematic Cursor System
   Magnetic attraction | Particle trails | 3D card tilt
   Click bursts | Context-aware glow | Smooth lag ring
   ============================================================ */
(function () {
  'use strict';

  /* ── DOM SETUP ─────────────────────────────────────────── */
  const dot   = document.getElementById('cursorDot');
  const ring  = document.getElementById('cursorRing');
  const glow  = document.getElementById('cursorGlow');
  const trail = document.getElementById('cursorTrail');
  if (!dot || !ring) return;

  /* ── STATE ─────────────────────────────────────────────── */
  let mx = -200, my = -200;          // real mouse
  let rx = -200, ry = -200;          // ring position (lagged)
  let gx = -200, gy = -200;          // glow position (more lagged)
  let isHovering = false;
  let magnetTarget = null;
  let magnetX = 0, magnetY = 0;

  /* ── TRAIL DOTS ─────────────────────────────────────────── */
  const TRAIL_LEN = 14;
  const trailDots = [];
  const trailPos  = Array.from({length:TRAIL_LEN}, () => ({x:-200,y:-200}));
  for (let i = 0; i < TRAIL_LEN; i++) {
    const d = document.createElement('div');
    d.className = 'cursor-trail-dot';
    d.style.cssText = `opacity:${(1-(i/TRAIL_LEN))*0.45};transform:scale(${1-(i/TRAIL_LEN)*0.7})`;
    document.body.appendChild(d);
    trailDots.push(d);
  }

  /* ── MOUSE TRACKING ─────────────────────────────────────── */
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;

    // Check magnetic targets
    const els = document.querySelectorAll('.magnetic,.btn-add,.btn-auth,.nav-item,.glass-card,.stat-card,.project-card,.social-btn');
    let found = false;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;
      const dist = Math.hypot(mx - cx, my - cy);
      const threshold = Math.max(r.width, r.height) * 0.8;
      if (dist < threshold) {
        const strength = (1 - dist / threshold) * 0.38;
        magnetX = cx + (mx - cx) * (1 - strength);
        magnetY = cy + (my - cy) * (1 - strength);
        magnetTarget = el;
        found = true;
      }
    });
    if (!found) { magnetTarget = null; magnetX = mx; magnetY = my; }
  });

  document.addEventListener('mouseleave', () => { mx = my = rx = ry = -300; });

  /* ── HOVER DETECTION ─────────────────────────────────────── */
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('button,a,.nav-item,.glass-card,.stat-card,.project-card,.kan-item,.task-card,.btn-add,.btn-auth,.auth-tab,.social-btn,.filter-btn');
    if (t) {
      isHovering = true;
      dot.classList.add('hovering');
      ring.classList.add('hovering');

      // Context color
      let col = '#b09eff';
      if (t.classList.contains('btn-add') || t.classList.contains('btn-auth')) col = '#a78bfa';
      if (t.closest('.view')?.id === 'view-tasks') col = '#60c7ff';
      if (t.closest('.view')?.id === 'view-analytics') col = '#4ade80';
      ring.style.borderColor = col;
      ring.style.boxShadow   = `0 0 20px ${col}88, 0 0 40px ${col}44`;
      dot.style.background   = col;
      dot.style.boxShadow    = `0 0 12px ${col}`;
    }
  });

  document.addEventListener('mouseout', e => {
    const t = e.target.closest('button,a,.nav-item,.glass-card,.stat-card,.project-card,.kan-item,.task-card,.btn-add,.btn-auth,.auth-tab,.social-btn,.filter-btn');
    if (t) {
      isHovering = false;
      dot.classList.remove('hovering');
      ring.classList.remove('hovering');
      ring.style.borderColor = '';
      ring.style.boxShadow   = '';
      dot.style.background   = '';
      dot.style.boxShadow    = '';
    }
  });

  /* ── CLICK BURST ─────────────────────────────────────────── */
  document.addEventListener('click', e => {
    createBurst(e.clientX, e.clientY);
    dot.classList.add('clicking');
    ring.classList.add('clicking');
    setTimeout(() => { dot.classList.remove('clicking'); ring.classList.remove('clicking'); }, 200);
  });

  function createBurst(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'cursor-burst-particle';
      const angle  = (i / count) * Math.PI * 2;
      const dist   = 30 + Math.random() * 40;
      const size   = Math.random() * 4 + 2;
      const cols   = ['#b09eff','#60c7ff','#4ade80','#fb923c','#ffffff'];
      const col    = cols[Math.floor(Math.random() * cols.length)];
      p.style.cssText = `
        left:${x}px; top:${y}px; width:${size}px; height:${size}px;
        background:${col}; box-shadow:0 0 ${size*3}px ${col};
        --bx:${Math.cos(angle)*dist}px; --by:${Math.sin(angle)*dist}px;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  /* ── 3D CARD TILT ─────────────────────────────────────────── */
  function initTilt() {
    const cards = document.querySelectorAll('.glass-card,.stat-card,.project-card,.auth-card,.feature-item,.preview-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top  + r.height / 2;
        const dx = (e.clientX - cx) / (r.width  / 2);
        const dy = (e.clientY - cy) / (r.height / 2);
        const tiltX = dy * -10;
        const tiltY = dx *  10;
        const shine = ((e.clientX - r.left) / r.width) * 100;
        card.style.transform   = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(8px)`;
        card.style.transition  = 'transform 0.05s linear';
        // Shimmer highlight
        card.style.setProperty('--shine-x', shine + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform  = '';
        card.style.transition = 'transform 0.55s cubic-bezier(.4,0,.2,1)';
      });
    });
  }
  // Re-init tilt when new cards appear (task list updates)
  const tiltObserver = new MutationObserver(initTilt);
  tiltObserver.observe(document.body, { childList: true, subtree: true });
  initTilt();

  /* ── ANIMATION LOOP ─────────────────────────────────────── */
  let frame = 0;
  function tick() {
    frame++;
    const tx = magnetTarget ? magnetX : mx;
    const ty = magnetTarget ? magnetY : my;

    // Ring lags behind
    rx += (tx - rx) * 0.14;
    ry += (ty - ry) * 0.14;

    // Glow lags more
    gx += (tx - gx) * 0.07;
    gy += (ty - gy) * 0.07;

    // Dot snaps
    dot.style.transform  = `translate(${mx - 4}px, ${my - 4}px)`;
    ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
    if (glow) glow.style.transform = `translate(${gx - 60}px, ${gy - 60}px)`;

    // Trail update
    trailPos.unshift({ x: mx, y: my });
    trailPos.length = TRAIL_LEN;
    trailDots.forEach((d, i) => {
      const p = trailPos[i + 1] || trailPos[0];
      d.style.transform = `translate(${p.x - 3}px, ${p.y - 3}px)`;
    });

    requestAnimationFrame(tick);
  }
  tick();

})();