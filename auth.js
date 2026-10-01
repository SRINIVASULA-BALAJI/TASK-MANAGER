/* ============================================================
   AUTH.JS v3 - Cinematic Background + Complete Auth Logic
   ============================================================ */

// ─── REDIRECT IF ALREADY LOGGED IN ──────────────────────────
const existingSession = localStorage.getItem('tm_session');
if (existingSession) {
  try {
    const s = JSON.parse(existingSession);
    if (s && s.id) { window.location.href = 'index.html'; }
  } catch(e) { localStorage.removeItem('tm_session'); }
}

// ─── CINEMATIC BACKGROUND ENGINE ────────────────────────────
(function () {
  const bgC = document.getElementById('authCanvas');
  const aurC = document.getElementById('authAurora');
  if (!bgC) return;
  const bgX = bgC.getContext('2d');
  const aurX = aurC ? aurC.getContext('2d') : null;
  let W = 0, H = 0, frame = 0;
  const stars = [], shooters = [], aurora = [], fog = [], nets = [];

  function resize() {
    W = bgC.width = window.innerWidth;
    H = bgC.height = window.innerHeight;
    if (aurC) { aurC.width = W; aurC.height = H; }
  }
  resize();
  window.addEventListener('resize', resize);

  // Stars
  const starCols = ['#ffffff','#ede9fe','#c4b5fd','#bae6fd','#a5f3fc'];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.8+0.3, a: Math.random()*0.7+0.2,
      phase: Math.random()*Math.PI*2, spd: Math.random()*0.018+0.005,
      col: starCols[Math.floor(Math.random()*starCols.length)]
    });
  }

  // Shooting stars
  function mkShooter(init) {
    const ang = (Math.random()*45+20)*Math.PI/180;
    return {
      x: Math.random()*W, y: init ? Math.random()*H*0.5 : -80,
      vx: Math.cos(ang)*(Math.random()*9+5), vy: Math.sin(ang)*(Math.random()*9+5),
      len: Math.random()*130+60, alpha: 0, maxAlpha: Math.random()*0.65+0.3,
      fadeIn: true, delay: Math.floor(Math.random()*280)
    };
  }
  for (let i = 0; i < 5; i++) shooters.push(mkShooter(true));

  // Aurora
  const aCols = ['rgba(124,58,237,','rgba(99,102,241,','rgba(37,99,235,','rgba(16,185,129,','rgba(168,85,247,'];
  for (let i = 0; i < 5; i++) {
    aurora.push({
      y: H*(0.04+i*0.055), amp: 45+Math.random()*60,
      wl: 0.003+Math.random()*0.003, spd: 0.003+Math.random()*0.005,
      phase: Math.random()*Math.PI*2, col: aCols[i],
      op: 0.12+Math.random()*0.2, w: 70+Math.random()*90,
      pp: Math.random()*Math.PI*2, ps: 0.006+Math.random()*0.01
    });
  }

  // Fog
  const fCols = ['rgba(124,58,237,','rgba(37,99,235,','rgba(16,185,129,','rgba(109,40,217,'];
  for (let i = 0; i < 16; i++) {
    fog.push({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*150+70,
      vx: (Math.random()-0.5)*0.14, vy: (Math.random()-0.5)*0.1,
      op: Math.random()*0.04+0.01,
      col: fCols[Math.floor(Math.random()*fCols.length)],
      phase: Math.random()*Math.PI*2, ps: 0.004+Math.random()*0.006
    });
  }

  // Particle net
  const nCols = ['#b09eff','#60c7ff','#4ade80','#fb923c','#818cf8'];
  for (let i = 0; i < 50; i++) {
    nets.push({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.36, vy: (Math.random()-0.5)*0.36,
      r: Math.random()*2+0.4, a: Math.random()*0.4+0.1,
      col: nCols[Math.floor(Math.random()*nCols.length)],
      pulse: Math.random()*Math.PI*2
    });
  }

  function drawStars() {
    stars.forEach(s => {
      s.phase += s.spd;
      const a = s.a*(0.5+0.5*Math.sin(s.phase));
      const r = s.r*(0.88+0.12*Math.sin(s.phase*1.4));
      const g = bgX.createRadialGradient(s.x,s.y,0,s.x,s.y,r*7);
      g.addColorStop(0,s.col+'88'); g.addColorStop(1,'transparent');
      bgX.beginPath(); bgX.arc(s.x,s.y,r*7,0,Math.PI*2); bgX.fillStyle=g; bgX.fill();
      bgX.beginPath(); bgX.arc(s.x,s.y,r,0,Math.PI*2);
      bgX.fillStyle=s.col; bgX.globalAlpha=a; bgX.fill(); bgX.globalAlpha=1;
    });
  }

  function drawShooters() {
    shooters.forEach((s,i) => {
      if (s.delay > 0) { s.delay--; return; }
      s.x+=s.vx; s.y+=s.vy;
      if (s.fadeIn) { s.alpha=Math.min(s.alpha+0.055,s.maxAlpha); if(s.alpha>=s.maxAlpha) s.fadeIn=false; }
      else { s.alpha=Math.max(s.alpha-0.026,0); }
      if (s.alpha<=0||s.x>W+120||s.y>H+120) { shooters[i]=mkShooter(false); return; }
      const spd=Math.hypot(s.vx,s.vy);
      const tx=s.x-s.vx*(s.len/spd), ty=s.y-s.vy*(s.len/spd);
      const gr=bgX.createLinearGradient(tx,ty,s.x,s.y);
      gr.addColorStop(0,'rgba(255,255,255,0)');
      gr.addColorStop(0.65,'rgba(200,188,255,'+(s.alpha*0.4)+')');
      gr.addColorStop(1,'rgba(255,255,255,'+s.alpha+')');
      bgX.beginPath(); bgX.moveTo(tx,ty); bgX.lineTo(s.x,s.y);
      bgX.strokeStyle=gr; bgX.lineWidth=1.8; bgX.stroke();
      const hg=bgX.createRadialGradient(s.x,s.y,0,s.x,s.y,7);
      hg.addColorStop(0,'rgba(255,255,255,'+s.alpha+')'); hg.addColorStop(1,'transparent');
      bgX.beginPath(); bgX.arc(s.x,s.y,7,0,Math.PI*2); bgX.fillStyle=hg; bgX.fill();
    });
  }

  function drawAurora() {
    if (!aurX) return;
    aurX.clearRect(0,0,W,H);
    aurora.forEach(b => {
      b.phase+=b.spd; b.pp+=b.ps;
      const op=b.op*(0.65+0.35*Math.sin(b.pp));
      const gr=aurX.createLinearGradient(0,b.y-b.w,0,b.y+b.w);
      gr.addColorStop(0,b.col+'0)'); gr.addColorStop(0.3,b.col+(op*0.5)+')');
      gr.addColorStop(0.5,b.col+op+')'); gr.addColorStop(0.7,b.col+(op*0.5)+')'); gr.addColorStop(1,b.col+'0)');
      aurX.beginPath(); aurX.moveTo(0,b.y);
      for (let x=0;x<=W;x+=6) {
        const y=b.y+Math.sin(x*b.wl+b.phase)*b.amp+Math.sin(x*b.wl*2.4+b.phase*0.65)*(b.amp*0.3);
        aurX.lineTo(x,y);
      }
      aurX.lineTo(W,b.y+b.w*2.2); aurX.lineTo(0,b.y+b.w*2.2); aurX.closePath();
      aurX.fillStyle=gr; aurX.fill();
    });
  }

  function drawFog() {
    fog.forEach(p => {
      p.x+=p.vx; p.y+=p.vy; p.phase+=p.ps;
      if(p.x<-p.r*2)p.x=W+p.r; if(p.x>W+p.r*2)p.x=-p.r;
      if(p.y<-p.r*2)p.y=H+p.r; if(p.y>H+p.r*2)p.y=-p.r;
      const op=p.op*(0.7+0.3*Math.sin(p.phase));
      bgX.shadowBlur=70; bgX.shadowColor=p.col+op+')';
      const g=bgX.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      g.addColorStop(0,p.col+op+')'); g.addColorStop(1,p.col+'0)');
      bgX.beginPath(); bgX.arc(p.x,p.y,p.r,0,Math.PI*2); bgX.fillStyle=g; bgX.fill();
      bgX.shadowBlur=0;
    });
  }

  function drawGodRays() {
    const srcs=[{x:W*0.08,y:-40},{x:W*0.92,y:-40}];
    srcs.forEach((src,si) => {
      for(let i=0;i<4;i++) {
        const ang=(si===0?18+i*16:162-i*16)*Math.PI/180;
        const len=H*1.6;
        const ex=src.x+Math.cos(ang)*len, ey=src.y+Math.sin(ang)*len;
        const op=0.022+0.011*Math.sin(frame*0.01+i+si*2);
        const g=bgX.createLinearGradient(src.x,src.y,ex,ey);
        g.addColorStop(0,'rgba(176,158,255,'+op+')');
        g.addColorStop(0.4,'rgba(96,199,255,'+(op*0.6)+')');
        g.addColorStop(1,'rgba(176,158,255,0)');
        bgX.beginPath(); bgX.moveTo(src.x-12,src.y); bgX.lineTo(ex-22,ey); bgX.lineTo(ex+22,ey); bgX.lineTo(src.x+12,src.y);
        bgX.closePath(); bgX.fillStyle=g; bgX.fill();
      }
    });
  }

  function drawNets() {
    nets.forEach((p,i) => {
      p.x+=p.vx; p.y+=p.vy; p.pulse+=0.016;
      if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1;
      for(let j=i+1;j<nets.length;j++) {
        const dx=p.x-nets[j].x, dy=p.y-nets[j].y, d=Math.hypot(dx,dy);
        if(d<125) { bgX.beginPath(); bgX.strokeStyle='rgba(176,158,255,'+(0.075*(1-d/125))+')'; bgX.lineWidth=0.55; bgX.moveTo(p.x,p.y); bgX.lineTo(nets[j].x,nets[j].y); bgX.stroke(); }
      }
      const r=p.r+Math.sin(p.pulse)*0.4;
      bgX.beginPath(); bgX.arc(p.x,p.y,r,0,Math.PI*2);
      bgX.fillStyle=p.col; bgX.globalAlpha=p.a+Math.sin(p.pulse)*0.05; bgX.fill(); bgX.globalAlpha=1;
    });
  }

  function loop() {
    frame++;
    bgX.clearRect(0,0,W,H);
    drawGodRays();
    drawStars();
    drawShooters();
    drawNets();
    drawAurora();
    drawFog();
    requestAnimationFrame(loop);
  }
  loop();
})();

// ─── TAB SWITCHER ────────────────────────────────────────────
function showTab(tab) {
  const signin = tab === 'signin';
  document.getElementById('tabSignin').classList.toggle('active', signin);
  document.getElementById('tabSignup').classList.toggle('active', !signin);
  document.getElementById('formSignin').classList.toggle('active', signin);
  document.getElementById('formSignup').classList.toggle('active', !signin);
  const thumb = document.getElementById('tabThumb');
  if (thumb) thumb.classList.toggle('right', !signin);
}

// ─── PASSWORD VISIBILITY ──────────────────────────────────────
function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  const isText = inp.type === 'text';
  inp.type = isText ? 'password' : 'text';
  // Toggle eye icon
  const eyeOpen = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeOff  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  btn.innerHTML = isText ? eyeOpen : eyeOff;
}

// ─── PASSWORD STRENGTH ────────────────────────────────────────
function checkStrength(val) {
  const fill = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill || !label) return;
  let score = 0;
  if (val.length >= 8)  score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  if (val.length >= 12) score++;
  const levels = [
    {w:'0%',   col:'#ff6b8a', txt:''},
    {w:'20%',  col:'#ff6b8a', txt:'Very weak'},
    {w:'40%',  col:'#fb923c', txt:'Weak'},
    {w:'60%',  col:'#facc15', txt:'Fair'},
    {w:'80%',  col:'#4ade80', txt:'Strong'},
    {w:'100%', col:'#4ade80', txt:'Very strong ✓'},
  ];
  const lv = levels[Math.min(score, 5)];
  fill.style.width = val ? lv.w : '0%';
  fill.style.background = lv.col;
  label.textContent = val ? lv.txt : '';
  label.style.color = lv.col;
}

// ─── HASH UTILITY ─────────────────────────────────────────────
function hashPass(p) {
  let h = 0x12345678;
  for (let i = 0; i < p.length; i++) {
    h = Math.imul(31, h) ^ p.charCodeAt(i);
    h = (h ^ (h >>> 16)) >>> 0;
  }
  return 'h_' + h.toString(16).padStart(8,'0');
}

// ─── SIGN IN ──────────────────────────────────────────────────
function handleSignin(e) {
  e.preventDefault();
  const email = document.getElementById('siEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('siPassword').value;
  const btn   = document.getElementById('siBtn');
  const errEl = document.getElementById('siError');
  const okEl  = document.getElementById('siSuccess');

  function showErr(msg) {
    errEl.textContent = msg; errEl.className = 'auth-error show';
    okEl.className = 'auth-success';
  }
  function showOk(msg) {
    okEl.textContent = msg; okEl.className = 'auth-success show';
    errEl.className = 'auth-error';
  }

  errEl.className = 'auth-error'; okEl.className = 'auth-success';
  btn.classList.add('loading');

  setTimeout(() => {
    btn.classList.remove('loading');
    const users = JSON.parse(localStorage.getItem('tm_users') || '[]');
    const user = users.find(u => u.email === email);
    if (!user) { showErr('No account found with that email.'); return; }
    if (user.password !== hashPass(pass)) { showErr('Incorrect password. Please try again.'); return; }

    const session = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, avatar: user.avatar };
    localStorage.setItem('tm_session', JSON.stringify(session));
    if (document.getElementById('rememberMe')?.checked) {
      localStorage.setItem('tm_remember', user.id);
    }
    showOk('✓ Signed in! Redirecting...');
    setTimeout(() => window.location.href = 'index.html', 800);
  }, 950);
}

// ─── SIGN UP ──────────────────────────────────────────────────
function handleSignup(e) {
  e.preventDefault();
  const first   = document.getElementById('suFirst').value.trim();
  const last    = document.getElementById('suLast').value.trim();
  const email   = document.getElementById('suEmail').value.trim().toLowerCase();
  const pass    = document.getElementById('suPassword').value;
  const confirm = document.getElementById('suConfirm').value;
  const btn     = document.getElementById('suBtn');
  const errEl   = document.getElementById('suError');
  const okEl    = document.getElementById('suSuccess');

  function showErr(msg) { errEl.textContent=msg; errEl.className='auth-error show'; okEl.className='auth-success'; }
  function showOk(msg)  { okEl.textContent=msg; okEl.className='auth-success show'; errEl.className='auth-error'; }

  errEl.className='auth-error'; okEl.className='auth-success';

  if (pass.length < 8) { showErr('Password must be at least 8 characters.'); return; }
  if (pass !== confirm) { showErr('Passwords do not match.'); return; }

  btn.classList.add('loading');

  setTimeout(() => {
    btn.classList.remove('loading');
    const users = JSON.parse(localStorage.getItem('tm_users') || '[]');
    if (users.find(u => u.email === email)) { showErr('An account with this email already exists.'); return; }

    const user = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      firstName: first, lastName: last, email,
      password: hashPass(pass),
      avatar: (first[0]||'') + (last[0]||''),
      createdAt: Date.now()
    };
    users.push(user);
    localStorage.setItem('tm_users', JSON.stringify(users));

    const session = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, avatar: user.avatar };
    localStorage.setItem('tm_session', JSON.stringify(session));
    showOk('✓ Account created! Redirecting...');
    setTimeout(() => window.location.href = 'index.html', 800);
  }, 1100);
}

// ─── SOCIAL LOGIN ─────────────────────────────────────────────
function socialLogin(provider) {
  const names = {Google:['Alex','Rivera'], GitHub:['Sam','Chen']};
  const [firstName, lastName] = names[provider] || ['Demo','User'];
  const email = firstName.toLowerCase()+'@'+provider.toLowerCase()+'.demo';
  const users = JSON.parse(localStorage.getItem('tm_users') || '[]');
  let user = users.find(u => u.email === email);
  if (!user) {
    user = { id: Date.now().toString(36), firstName, lastName, email, password: '', avatar: firstName[0]+lastName[0], createdAt: Date.now() };
    users.push(user);
    localStorage.setItem('tm_users', JSON.stringify(users));
  }
  const session = { id: user.id, firstName, lastName, email, avatar: user.avatar };
  localStorage.setItem('tm_session', JSON.stringify(session));
  window.location.href = 'index.html';
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────
function forgotPassword(e) {
  e.preventDefault();
  const errEl = document.getElementById('siError');
  const okEl  = document.getElementById('siSuccess');
  errEl.className = 'auth-error';
  okEl.textContent = '📧 Password reset link sent to your email! (Demo mode)';
  okEl.className = 'auth-success show';
  setTimeout(() => okEl.className = 'auth-success', 4000);
}