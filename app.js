/* ============================================================
   TASKMASTER app.js v2 - With Auth Guard
   ============================================================ */

// ─── AUTH GUARD ─────────────────────────────────────────────
const session = JSON.parse(localStorage.getItem('tm_session') || 'null');
if (!session) { window.location.href = 'auth.html'; }

const authGuard = document.getElementById('authGuard');
const appWrapper = document.getElementById('appWrapper');

// Populate user info in sidebar
function initUser() {
  if (!session) return;
  const name = session.firstName + ' ' + session.lastName;
  const initials = (session.firstName[0]||'') + (session.lastName?.[0]||'');
  document.getElementById('greetingName').textContent = session.firstName;
  document.getElementById('greetingAvatar').textContent = initials.toUpperCase();
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarAvatar').textContent = initials.toUpperCase();
  // Greeting time of day
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
  document.querySelector('.greeting-hi').textContent = greet;
}
initUser();

// Show app after short delay (smooth guard fade)
setTimeout(() => {
  authGuard.style.opacity = '0';
  setTimeout(() => { authGuard.style.display = 'none'; appWrapper.style.display = 'flex'; }, 500);
}, 400);

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('tm_session');
  localStorage.removeItem('tm_remember');
  window.location.href = 'auth.html';
});

// ─── LIVE WALLPAPER ──────────────────────────────────────────
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles2d = [], frame = 0;

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function initParticles2d() {
  particles2d = [];
  for (let i = 0; i < 65; i++) {
    particles2d.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random()-0.5)*0.45,
      vy: (Math.random()-0.5)*0.45,
      radius: Math.random()*2.5+0.5,
      alpha: Math.random()*0.45+0.1,
      color: ['#a78bfa','#60a5fa','#34d399','#fb923c','#818cf8'][Math.floor(Math.random()*5)],
      pulse: Math.random()*Math.PI*2,
    });
  }
}
initParticles2d();

function drawWallpaper() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  frame++;
  particles2d.forEach((p,i) => {
    p.x+=p.vx; p.y+=p.vy; p.pulse+=0.015;
    if(p.x<0||p.x>canvas.width) p.vx*=-1;
    if(p.y<0||p.y>canvas.height) p.vy*=-1;
    const r = p.radius + Math.sin(p.pulse)*0.5;
    for(let j=i+1;j<particles2d.length;j++){
      const dx=p.x-particles2d[j].x, dy=p.y-particles2d[j].y, dist=Math.hypot(dx,dy);
      if(dist<130){
        ctx.beginPath();
        ctx.strokeStyle='rgba(167,139,250,'+(0.09*(1-dist/130))+')';
        ctx.lineWidth=0.7;
        ctx.moveTo(p.x,p.y); ctx.lineTo(particles2d[j].x,particles2d[j].y); ctx.stroke();
      }
    }
    const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*7);
    g.addColorStop(0,p.color+'45'); g.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(p.x,p.y,r*7,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fillStyle=p.color;
    ctx.globalAlpha=p.alpha+Math.sin(p.pulse)*0.06; ctx.fill(); ctx.globalAlpha=1;
  });
  // Wave
  ctx.beginPath(); ctx.moveTo(0,canvas.height);
  for(let x=0;x<=canvas.width;x+=8){
    const y=canvas.height-50+Math.sin((x*0.004)+frame*0.018)*18+Math.sin((x*0.01)+frame*0.012)*9;
    ctx.lineTo(x,y);
  }
  ctx.lineTo(canvas.width,canvas.height); ctx.closePath();
  ctx.fillStyle='rgba(124,58,237,0.035)'; ctx.fill();
  requestAnimationFrame(drawWallpaper);
}
drawWallpaper();

// DOM particles
(function spawnDomParticles(){
  const c=document.getElementById('particles-container');
  if(!c) return;
  for(let i=0;i<28;i++){
    const p=document.createElement('div'); p.className='particle';
    p.style.cssText='left:'+Math.random()*100+'%;bottom:'+Math.random()*10+'%;width:'+(Math.random()*3+1)+'px;height:'+(Math.random()*3+1)+'px;animation-duration:'+(Math.random()*12+6)+'s;animation-delay:'+(Math.random()*10)+'s;';
    c.appendChild(p);
  }
})();

// ─── STATE ───────────────────────────────────────────────────
const userKey = 'tm_tasks_' + (session?.id || 'guest');
let tasks = JSON.parse(localStorage.getItem(userKey) || '[]');
let editingId = null;
let currentFilter = 'all';
let calDate = new Date();
let draggedId = null;

const projectMeta = {
  work:     {color:'#a78bfa',emoji:'💼',name:'Work'},
  personal: {color:'#34d399',emoji:'🌟',name:'Personal'},
  design:   {color:'#fb923c',emoji:'🎨',name:'Design'},
  dev:      {color:'#60a5fa',emoji:'💻',name:'Dev'},
};
const priorityMeta = {
  low:    {color:'#34d399',label:'Low',order:1},
  medium: {color:'#a78bfa',label:'Medium',order:2},
  high:   {color:'#fb923c',label:'High',order:3},
  urgent: {color:'#f87171',label:'Urgent',order:4},
};

// ─── NAVIGATION ───────────────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const viewTitles = {dashboard:'Dashboard',tasks:'All Tasks',projects:'Projects',calendar:'Calendar',analytics:'Analytics'};
const viewSubs = {dashboard:'Here is your productivity overview.',tasks:'Manage and track all your tasks.',projects:'View progress across your projects.',calendar:'See your tasks on the calendar.',analytics:'Your activity and performance insights.'};

function switchView(name) {
  navItems.forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  views.forEach(v=>v.classList.toggle('active',v.id==='view-'+name));
  document.getElementById('viewTitle').textContent=viewTitles[name]||name;
  document.getElementById('viewSubtitle').textContent=viewSubs[name]||'';
  if(name==='tasks') renderTaskList();
  if(name==='projects') renderProjects();
  if(name==='calendar') renderCalendar();
  if(name==='analytics') renderAnalytics();
}

navItems.forEach(n=>n.addEventListener('click',e=>{e.preventDefault();switchView(n.dataset.view);}));
document.querySelectorAll('[data-view]').forEach(el=>{
  if(!el.classList.contains('nav-item')) el.addEventListener('click',e=>{e.preventDefault();switchView(el.dataset.view);});
});

// Sidebar toggle
const sidebar=document.getElementById('sidebar');
document.getElementById('hamburger').addEventListener('click',()=>sidebar.classList.toggle('open'));
document.addEventListener('click',e=>{
  if(window.innerWidth<=768&&sidebar.classList.contains('open')&&!sidebar.contains(e.target)&&!document.getElementById('hamburger').contains(e.target))
    sidebar.classList.remove('open');
});

// ─── THEME TOGGLE (with persistence) ─────────────────────────
const themeBtn = document.getElementById('themeToggle');
let isLight = localStorage.getItem('tm_theme') === 'light';

function applyTheme(light) {
  isLight = light;
  document.body.classList.toggle('light-theme', light);
  themeBtn.textContent = light ? '☀️' : '🌙';
  themeBtn.title = light ? 'Switch to dark mode' : 'Switch to light mode';
  localStorage.setItem('tm_theme', light ? 'light' : 'dark');
  // Dim canvas layers in light mode
  const canvases = ['bgCanvas','auroraCanvas','fogCanvas'];
  canvases.forEach(id => {
    const c = document.getElementById(id);
    if (c) c.style.transition = 'opacity 0.6s ease';
    if (c) c.style.opacity = light ? '0.15' : '1';
  });
  // Grain & scanlines behave differently in light mode
  const grain = document.querySelector('.grain');
  if (grain) grain.style.opacity = light ? '0.015' : '0.03';
}

// Load saved theme on start
applyTheme(isLight);

themeBtn.addEventListener('click', () => applyTheme(!isLight));

// ─── MODAL ───────────────────────────────────────────────────
const overlay=document.getElementById('modalOverlay');
const form=document.getElementById('taskForm');

function openModal(task=null){
  editingId=task?task.id:null;
  document.getElementById('modalTitle').textContent=task?'✏️ Edit Task':'✨ New Task';
  document.getElementById('taskTitle').value=task?.title||'';
  document.getElementById('taskDesc').value=task?.desc||'';
  document.getElementById('taskProject').value=task?.project||'work';
  document.getElementById('taskPriority').value=task?.priority||'medium';
  document.getElementById('taskDeadline').value=task?.deadline||'';
  document.getElementById('taskStatus').value=task?.status||'todo';
  document.getElementById('taskAssign').value=task?.assign||'';
  document.getElementById('taskTags').value=task?.tags||'';
  overlay.classList.add('open');
  setTimeout(()=>document.getElementById('taskTitle').focus(),200);
}
function closeModal(){overlay.classList.remove('open');form.reset();editingId=null;}

document.getElementById('openModal').addEventListener('click',()=>openModal());
document.getElementById('closeModal').addEventListener('click',closeModal);
document.getElementById('cancelModal').addEventListener('click',closeModal);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

form.addEventListener('submit',e=>{
  e.preventDefault();
  const task={
    id:editingId||Date.now().toString(36)+Math.random().toString(36).slice(2),
    title:document.getElementById('taskTitle').value.trim(),
    desc:document.getElementById('taskDesc').value.trim(),
    project:document.getElementById('taskProject').value,
    priority:document.getElementById('taskPriority').value,
    deadline:document.getElementById('taskDeadline').value,
    status:document.getElementById('taskStatus').value,
    assign:document.getElementById('taskAssign').value.trim(),
    tags:document.getElementById('taskTags').value.trim(),
    createdAt:editingId?(tasks.find(t=>t.id===editingId)?.createdAt||Date.now()):Date.now(),
  };
  if(editingId){
    const idx=tasks.findIndex(t=>t.id===editingId);
    if(idx!==-1) tasks[idx]=task;
    toast('Task updated!','success');
  } else {
    tasks.unshift(task);
    toast('Task created! 🎉','success');
  }
  saveTasks();closeModal();refreshAll();checkDeadlines();
});

// ─── DATA ────────────────────────────────────────────────────
function saveTasks(){localStorage.setItem(userKey,JSON.stringify(tasks));}

function refreshAll(){
  updateStats();renderRecentTasks();renderKanban();
  updateProjectCounts();
  if(document.getElementById('view-tasks').classList.contains('active')) renderTaskList();
  if(document.getElementById('view-projects').classList.contains('active')) renderProjects();
  if(document.getElementById('view-calendar').classList.contains('active')) renderCalendar();
  if(document.getElementById('view-analytics').classList.contains('active')) renderAnalytics();
  drawDonut();
}

// ─── STATS ───────────────────────────────────────────────────
function updateStats(){
  const total=tasks.length;
  const done=tasks.filter(t=>t.status==='done').length;
  const urgent=tasks.filter(t=>t.priority==='urgent'&&t.status!=='done').length;
  const inprog=tasks.filter(t=>t.status==='inprogress').length;
  const pct=total?Math.round(done/total*100):0;
  animateNum('totalCount',total);animateNum('doneCount',done);
  animateNum('urgentCount',urgent);animateNum('pendingCount',inprog);
  animateNum('totalBadge',total);
  document.getElementById('progressPct').textContent=pct+'%';
  document.getElementById('progressFill').style.width=pct+'%';
  const notifDot=document.getElementById('notifDot');
  if(notifDot) notifDot.classList.toggle('show',urgent>0);
}
function animateNum(id,target){
  const el=document.getElementById(id); if(!el) return;
  const start=parseInt(el.textContent)||0;
  const dur=700; const t0=performance.now();
  function step(now){
    const p=Math.min((now-t0)/dur,1);
    el.textContent=Math.round(start+(target-start)*easeOut(p));
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function easeOut(t){return 1-Math.pow(1-t,3);}

function updateProjectCounts(){
  Object.keys(projectMeta).forEach(k=>{
    const el=document.getElementById('pc-'+k);
    if(el) el.textContent=tasks.filter(t=>t.project===k&&t.status!=='done').length;
  });
}

// ─── DONUT ───────────────────────────────────────────────────
function drawDonut(){
  const c=document.getElementById('donutChart'); if(!c) return;
  const ctx=c.getContext('2d');
  const todo=tasks.filter(t=>t.status==='todo').length;
  const inp=tasks.filter(t=>t.status==='inprogress').length;
  const done=tasks.filter(t=>t.status==='done').length;
  const total=todo+inp+done||1;
  const data=[{v:todo/total,col:'#a78bfa'},{v:inp/total,col:'#fb923c'},{v:done/total,col:'#34d399'}];
  const cx=90,cy=90,r=60,ir=38;
  ctx.clearRect(0,0,180,180);
  let angle=-Math.PI/2;
  data.forEach(d=>{
    if(!d.v) return;
    const sw=d.v*Math.PI*2;
    ctx.beginPath();
    ctx.arc(cx,cy,r,angle,angle+sw);
    ctx.arc(cx,cy,ir,angle+sw,angle,true);
    ctx.closePath(); ctx.fillStyle=d.col; ctx.fill();
    angle+=sw;
  });
  const pct=tasks.length?Math.round(done/tasks.length*100):0;
  ctx.fillStyle='rgba(226,232,255,0.9)';
  ctx.font='bold 18px Space Grotesk,sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(tasks.length===0?'—':pct+'%',cx,cy);
  ctx.font='11px Inter,sans-serif';
  ctx.fillStyle='rgba(226,232,255,0.4)';
  ctx.fillText('complete',cx,cy+18);
}

// ─── RECENT TASKS ─────────────────────────────────────────────
function renderRecentTasks(){
  const el=document.getElementById('recentTasks'); if(!el) return;
  const recent=tasks.slice(0,6);
  if(!recent.length){el.innerHTML='<div class="empty-state">No tasks yet. Create your first! 🚀</div>';return;}
  el.innerHTML=recent.map(t=>`
    <div class="recent-task-item">
      <div class="task-check ${t.status==='done'?'done':''}" onclick="toggleTask('${t.id}')"></div>
      <span class="task-title-text ${t.status==='done'?'done':''}">${esc(t.title)}</span>
      <span class="priority-dot" style="background:${priorityMeta[t.priority]?.color||'#a78bfa'};box-shadow:0 0 6px ${priorityMeta[t.priority]?.color||'#a78bfa'}"></span>
    </div>
  `).join('');
}

// ─── KANBAN ───────────────────────────────────────────────────
function renderKanban(){
  ['todo','inprogress','done'].forEach(status=>{
    const el=document.getElementById('kan-'+status); if(!el) return;
    const items=tasks.filter(t=>t.status===status).slice(0,8);
    const cnt=document.getElementById('kcount-'+status);
    if(cnt) cnt.textContent=tasks.filter(t=>t.status===status).length;
    if(!items.length){el.innerHTML='<div style="font-size:12px;color:var(--fg3);text-align:center;padding:14px">No tasks</div>';return;}
    el.innerHTML=items.map(t=>`
      <div class="kan-item" draggable="true" data-id="${t.id}"
        ondragstart="onKanDragStart(event,'${t.id}')"
        style="border-left:3px solid ${priorityMeta[t.priority]?.color||'#a78bfa'}">
        <div class="kan-item-title">${esc(t.title)}</div>
        <div class="kan-item-meta">${projectMeta[t.project]?.emoji||''} ${projectMeta[t.project]?.name||t.project}</div>
      </div>
    `).join('');
  });
}
function onKanDragStart(e,id){draggedId=id;}
function onKanDrop(e,status){
  e.preventDefault();
  if(!draggedId) return;
  const t=tasks.find(x=>x.id===draggedId);
  if(t){t.status=status;saveTasks();refreshAll();toast('Moved to '+status,'info');}
  draggedId=null;
}

// ─── TASK LIST ────────────────────────────────────────────────
function renderTaskList(){
  const el=document.getElementById('taskListFull'); if(!el) return;
  const search=document.getElementById('searchInput').value.toLowerCase();
  const sort=document.getElementById('sortSelect')?.value||'newest';
  let filtered=[...tasks];
  if(currentFilter==='urgent') filtered=filtered.filter(t=>t.priority==='urgent');
  else if(currentFilter!=='all') filtered=filtered.filter(t=>t.status===currentFilter);
  if(search) filtered=filtered.filter(t=>t.title.toLowerCase().includes(search)||t.desc.toLowerCase().includes(search)||(t.tags||'').toLowerCase().includes(search));
  // Sort
  if(sort==='oldest') filtered.sort((a,b)=>a.createdAt-b.createdAt);
  else if(sort==='deadline') filtered.sort((a,b)=>(a.deadline||'9999')>(b.deadline||'9999')?1:-1);
  else if(sort==='priority') filtered.sort((a,b)=>(priorityMeta[b.priority]?.order||0)-(priorityMeta[a.priority]?.order||0));
  else filtered.sort((a,b)=>b.createdAt-a.createdAt);

  if(!filtered.length){el.innerHTML='<div class="empty-state" style="padding:60px">No tasks found 🔍</div>';return;}
  el.innerHTML=filtered.map(t=>{
    const pm=priorityMeta[t.priority]||{};
    const isOverdue=t.deadline&&new Date(t.deadline)<new Date()&&t.status!=='done';
    const tagsList=(t.tags||'').split(',').map(g=>g.trim()).filter(Boolean);
    return `
    <div class="task-card priority-${t.priority} ${t.status==='done'?'done-card':''}">
      <div class="task-check ${t.status==='done'?'done':''}" onclick="toggleTask('${t.id}')"></div>
      <div class="task-card-body">
        <div class="task-card-title ${t.status==='done'?'done':''}">${esc(t.title)}</div>
        ${t.desc?'<div class="task-card-desc">'+esc(t.desc)+'</div>':''}
        <div class="task-card-meta">
          <span class="task-tag project-${t.project}">${projectMeta[t.project]?.emoji||''} ${projectMeta[t.project]?.name||t.project}</span>
          <span class="task-tag" style="background:${pm.color+'20'};color:${pm.color};border-color:${pm.color+'35'}">${pm.label||t.priority}</span>
          ${t.deadline?'<span class="deadline-chip '+(isOverdue?'overdue':'')+'" >📅 '+formatDate(t.deadline)+(isOverdue?' ⚠️ Overdue':'')+' </span>':''}
          ${t.assign?'<span class="deadline-chip">👤 '+esc(t.assign)+'</span>':''}
        </div>
        ${tagsList.length?'<div class="task-tags-row">'+tagsList.map(tag=>'<span class="task-tag-pill">#'+esc(tag)+'</span>').join('')+'</div>':''}
      </div>
      <div class="task-card-actions">
        <button class="btn-icon" onclick="openModal(tasks.find(x=>x.id===\'${t.id}\'))" title="Edit">✏️</button>
        <button class="btn-icon delete" onclick="deleteTask(\'${t.id}\')" title="Delete">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); currentFilter=btn.dataset.filter; renderTaskList();
  });
});
document.getElementById('searchInput').addEventListener('input',()=>{
  if(document.getElementById('view-tasks').classList.contains('active')) renderTaskList();
});
document.getElementById('sortSelect')?.addEventListener('change',renderTaskList);

// ─── PROJECTS ─────────────────────────────────────────────────
function renderProjects(){
  const el=document.getElementById('projectsGrid'); if(!el) return;
  el.innerHTML=Object.entries(projectMeta).map(([key,meta])=>{
    const all=tasks.filter(t=>t.project===key);
    const done=all.filter(t=>t.status==='done').length;
    const pct=all.length?Math.round(done/all.length*100):0;
    return `
    <div class="project-card">
      <div class="project-card-top">
        <div class="project-icon">${meta.emoji}</div>
        <div>
          <div class="project-card-title">${meta.name}</div>
          <div class="project-card-count">${all.length} task${all.length!==1?'s':''}</div>
        </div>
      </div>
      <div class="project-progress-bar">
        <div class="project-progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${meta.color}99,${meta.color})"></div>
      </div>
      <div class="project-stats">
        <span>${done} of ${all.length} done</span>
        <span style="color:${meta.color};font-weight:700">${pct}%</span>
      </div>
      <div class="project-glow" style="background:${meta.color}"></div>
    </div>`;
  }).join('');
}

// ─── CALENDAR ─────────────────────────────────────────────────
function renderCalendar(){
  const title=document.getElementById('calTitle'), grid=document.getElementById('calGrid');
  if(!title||!grid) return;
  const y=calDate.getFullYear(),m=calDate.getMonth();
  title.textContent=calDate.toLocaleString('default',{month:'long',year:'numeric'});
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const today=new Date();
  let html='';
  const prevDays=new Date(y,m,0).getDate();
  for(let i=first-1;i>=0;i--) html+='<div class="cal-day other-month"><span>'+(prevDays-i)+'</span></div>';
  for(let d=1;d<=days;d++){
    const ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const hasTask=tasks.some(t=>t.deadline===ds);
    const isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
    html+='<div class="cal-day '+(isToday?'today':'')+(hasTask?' has-tasks':'')+'" title="'+(hasTask?'Has tasks':'')+'"><span>'+d+'</span></div>';
  }
  const rem=42-(first+days);
  for(let i=1;i<=rem;i++) html+='<div class="cal-day other-month"><span>'+i+'</span></div>';
  grid.innerHTML=html;
}
document.getElementById('calPrev').addEventListener('click',()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar();});
document.getElementById('calNext').addEventListener('click',()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar();});

// ─── ANALYTICS ────────────────────────────────────────────────
function renderAnalytics(){drawBarChart();drawPieChart();drawHeatmap();}

function drawBarChart(){
  const c=document.getElementById('barChart'); if(!c) return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height; ctx.clearRect(0,0,W,H);
  const projects=Object.entries(projectMeta);
  const barW=52,gap=28,startX=55;
  for(let i=0;i<=4;i++){
    const y=H-40-(i/4)*(H-60);
    ctx.beginPath(); ctx.strokeStyle='rgba(226,232,255,0.07)'; ctx.moveTo(40,y); ctx.lineTo(W-10,y); ctx.stroke();
    ctx.fillStyle='rgba(226,232,255,0.25)'; ctx.font='10px Inter'; ctx.textAlign='right'; ctx.fillText(i*25+'%',38,y+4);
  }
  projects.forEach(([key,meta],i)=>{
    const all=tasks.filter(t=>t.project===key);
    const done=all.filter(t=>t.status==='done').length;
    const pct=all.length?done/all.length:0;
    const x=startX+i*(barW+gap);
    const barH=pct*(H-60);
    const y=H-40-barH;
    const g=ctx.createLinearGradient(x,y,x,H-40);
    g.addColorStop(0,meta.color); g.addColorStop(1,meta.color+'44');
    ctx.fillStyle=g;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(x,y,barW,barH||2,6);
    else ctx.rect(x,y,barW,barH||2);
    ctx.fill();
    ctx.fillStyle='rgba(226,232,255,0.45)'; ctx.textAlign='center'; ctx.font='11px Inter';
    ctx.fillText(meta.name,x+barW/2,H-14);
    ctx.fillStyle=meta.color; ctx.font='bold 11px Inter';
    ctx.fillText(Math.round(pct*100)+'%',x+barW/2,y-8);
  });
}

function drawPieChart(){
  const c=document.getElementById('pieChart'); if(!c) return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height; ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2-10,r=70;
  const counts={low:0,medium:0,high:0,urgent:0};
  tasks.forEach(t=>counts[t.priority]=(counts[t.priority]||0)+1);
  const total=Object.values(counts).reduce((a,b)=>a+b,0)||1;
  let angle=-Math.PI/2;
  Object.entries(counts).forEach(([p,n])=>{
    if(!n) return;
    const sw=n/total*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle,angle+sw); ctx.closePath();
    ctx.fillStyle=priorityMeta[p].color; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=2; ctx.stroke();
    angle+=sw;
  });
  ctx.font='11px Inter';
  const legs=Object.entries(priorityMeta);
  legs.forEach(([p,m],i)=>{
    const lx=8+i*(W/4),ly=H-14;
    ctx.fillStyle=m.color; ctx.fillRect(lx,ly-8,10,10);
    ctx.fillStyle='rgba(226,232,255,0.55)'; ctx.fillText(m.label,lx+13,ly);
  });
}

function drawHeatmap(){
  const el=document.getElementById('heatmap'); if(!el) return;
  const taskDays={};
  tasks.forEach(t=>{
    const d=t.deadline||new Date(t.createdAt).toISOString().split('T')[0];
    taskDays[d]=(taskDays[d]||0)+1;
  });
  const now=new Date(); let html='';
  for(let i=364;i>=0;i--){
    const d=new Date(now.getTime()-i*86400000);
    const ds=d.toISOString().split('T')[0];
    const n=taskDays[ds]||0;
    const lv=n===0?'':n===1?'heat-l1':n===2?'heat-l2':n===3?'heat-l3':'heat-l4';
    html+='<div class="heat-cell '+lv+'" title="'+ds+': '+n+' tasks"></div>';
  }
  el.innerHTML=html;
}

// ─── TASK ACTIONS ─────────────────────────────────────────────
function toggleTask(id){
  const t=tasks.find(x=>x.id===id); if(!t) return;
  t.status=t.status==='done'?'todo':'done';
  saveTasks();refreshAll();
  toast(t.status==='done'?'Task completed! 🎉':'Task reopened','info');
}
function deleteTask(id){
  tasks=tasks.filter(t=>t.id!==id);
  saveTasks();refreshAll();toast('Task deleted','error');
}

// ─── DEADLINES ────────────────────────────────────────────────
function checkDeadlines(){
  const now=new Date();
  const banner=document.getElementById('deadlineBanner');
  const upcoming=tasks.filter(t=>{
    if(!t.deadline||t.status==='done') return false;
    const dl=new Date(t.deadline);
    const diff=(dl-now)/(1000*60*60*24);
    return diff<=2&&diff>=0;
  });
  if(upcoming.length){
    banner.textContent='⚠️ '+upcoming.length+' task'+(upcoming.length>1?'s':'')+' due soon: '+upcoming.map(t=>t.title).join(', ');
    banner.classList.add('show');
    setTimeout(()=>banner.classList.remove('show'),9000);
  }
  const overdue=tasks.filter(t=>t.deadline&&t.status!=='done'&&new Date(t.deadline)<now);
  if(overdue.length) setTimeout(()=>toast('🔴 '+overdue.length+' overdue task'+(overdue.length>1?'s':''),'warning'),1500);
}

// ─── TOAST ────────────────────────────────────────────────────
function toast(msg,type='info'){
  const icons={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
  const el=document.createElement('div'); el.className='toast '+type;
  el.innerHTML='<span class="toast-icon">'+(icons[type]||'ℹ️')+'</span><span>'+msg+'</span>';
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(()=>{el.classList.add('removing');setTimeout(()=>el.remove(),300);},3200);
}

// ─── UTILS ────────────────────────────────────────────────────
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function formatDate(d){if(!d) return '';const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}

// ─── DEMO DATA ────────────────────────────────────────────────
if(!tasks.length){
  const dl=(n)=>new Date(Date.now()+n*86400000).toISOString().split('T')[0];
  tasks=[
    {id:'t1',title:'Design new landing page',desc:'Create wireframes and mockups for the homepage redesign',project:'design',priority:'high',deadline:dl(2),status:'inprogress',assign:'Alice',tags:'design, ui',createdAt:Date.now()-5*86400000},
    {id:'t2',title:'Fix authentication bug',desc:'JWT token expiry not handled correctly on refresh',project:'dev',priority:'urgent',deadline:dl(1),status:'todo',assign:'Bob',tags:'bug, backend',createdAt:Date.now()-3*86400000},
    {id:'t3',title:'Weekly team standup',desc:'Sync on sprint progress and blockers',project:'work',priority:'medium',deadline:dl(5),status:'todo',assign:'Team',tags:'meeting',createdAt:Date.now()-2*86400000},
    {id:'t4',title:'Grocery shopping',desc:'Milk, eggs, bread, vegetables',project:'personal',priority:'low',deadline:'',status:'done',assign:'',tags:'',createdAt:Date.now()-7*86400000},
    {id:'t5',title:'Write API documentation',desc:'Document REST endpoints with request/response examples',project:'dev',priority:'medium',deadline:dl(7),status:'todo',assign:'Carol',tags:'docs, api',createdAt:Date.now()-86400000},
    {id:'t6',title:'User research interviews',desc:'Interview 5 target users for feature validation',project:'work',priority:'high',deadline:dl(3),status:'inprogress',assign:'Dave',tags:'research',createdAt:Date.now()-4*86400000},
  ];
  saveTasks();
}

refreshAll();
checkDeadlines();
setInterval(checkDeadlines,60000);