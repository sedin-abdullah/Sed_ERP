# SedERP — Industrial Operations Platform

Two products under one roof, sharing the **SedECom** design system:

- **SedIoT** — digital plant monitoring: live sensor streams, KPIs, machine registry, alerts, and a services catalog.
- **SedService** — on-demand field-service marketplace (User + Admin sub-tabs) with role-based access control.

**Core rule:** every write broadcasts over Socket.IO so all open tabs/clients update in real time.

## Tech stack (100% free)

React 18 + Vite + Tailwind · Zustand · React Router · Socket.IO · Node/Express · MongoDB + Mongoose · JWT + bcrypt · Recharts · Leaflet/OSM · react-i18next.

## Monorepo layout

```
SedERP/
├─ server/   Express + Mongoose + Socket.IO + JWT/RBAC
└─ client/   Vite + React + Tailwind (SedECom tokens)
```

## Run locally

Prerequisites: Node 20, and MongoDB running locally (or a MongoDB Atlas M0 URI).

```bash
# 1) Backend
cd server
cp .env.example .env          # set MONGODB_URI + JWT_SECRET
npm install
npm run seed                  # creates demo accounts
npm run dev                   # http://localhost:5100  (health: /api/v1/health)

# 2) Frontend (new terminal)
cd client
cp .env.example .env          # VITE_API_URL=http://localhost:5100/api/v1
npm install
npm run dev                   # http://localhost:5173
```

## Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@sederp.com` | `Admin@123` |
| User | `user1@sederp.com` / `user2@sederp.com` | `User@123` |
| Technician | `tech1@sederp.com` … `tech3@sederp.com` | `Tech@123` |

## Build status — Phase 1 (foundation) ✅

- Monorepo scaffold, SedECom design tokens, JWT auth + RBAC (roles + granular permissions).
- Socket.IO server + client with the broadcast/subscribe sync pattern.
- Home page (SedIoT / SedService entry cards), Login, and navigable module shells with a live connection indicator.

### Roadmap

2. SedIoT: simulator → live Dashboard (KPIs, Recharts, machine grid, alerts) → Machines → Alerts
3. SedIoT directories (Industries, Process Technologies, Services) + Reports + Portal
4. SedService Admin (Users/permissions, Technicians, Requests, Jobs Kanban, Coverage, Content)
5. SedService User (landing + map + request/quote forms via DummyJSON + REST Countries, My Requests)
6. Cross-module deep-links + i18n
7. Polish + free-tier deploy (Vercel + Render + Atlas M0)
