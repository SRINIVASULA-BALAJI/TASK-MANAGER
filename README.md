# TaskMaster 🎯

A cinematic, glassmorphism-style task management web app with:

- 🌌 **Cinematic live backgrounds** — Star field, Aurora Borealis, God rays, Volumetric fog, Shooting meteors, Particle network
- 🔐 **Authentication portal** — Sign In / Sign Up with per-user data isolation
- 📋 **Full task management** — Create, edit, delete, drag-drop Kanban
- 📊 **Analytics & Charts** — Donut chart, heatmap, bar/pie charts
- 🗓️ **Calendar view** — Visual task calendar
- 🌗 **Dark / Light mode** — Smooth toggle with persistence
- 📱 **Responsive** — Works on all screen sizes

## Files
| File | Description |
|------|-------------|
| `index.html` | Main app layout (5 views: Dashboard, Tasks, Projects, Calendar, Analytics) |
| `style.css` | Dark & light theme CSS, glassmorphism, cinematic overlays |
| `app.js` | App logic — auth guard, task CRUD, charts, kanban, theme toggle |
| `bg.js` | Cinematic background engine — 3-canvas star/aurora/fog rendering |
| `auth.html` | Sign In / Sign Up page |
| `auth.css` | Auth page styles |
| `auth.js` | Auth logic + cinematic canvas background |

## Getting Started

Just open `auth.html` in a browser — no build step required!

> All data is stored in your browser's `localStorage`. Demo accounts are created automatically.

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- Canvas 2D API for all animations
- Google Fonts (Inter + Space Grotesk)
- No frameworks, no dependencies

## License
MIT