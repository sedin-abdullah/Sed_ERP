# SedERP — Technical Documentation

Industrial operations platform with two products under one roof:

- **SedIoT** — real-time plant monitoring: live sensor telemetry, KPIs (OEE, energy, throughput), machine registry, alerts, reports, and remote machine control over MQTT.
- **SedService** — field-service marketplace: service requests, quotations, technician dispatch, and a jobs Kanban, with role-based access control.

**Core rule:** every server-side write broadcasts over Socket.IO, so all connected clients update in real time.

---

## 1. Tech stack (100% free)

### Frontend (`client/`)
| Concern | Tech |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS (SedECom design tokens, dark-first) |
| State | Zustand |
| Routing | React Router |
| Real-time | socket.io-client |
| Charts | Recharts |
| i18n | react-i18next + i18next-browser-languagedetector (9 languages + RTL) |
| HTTP | axios (JWT interceptor) |
| Icons | lucide-react |

### Backend (`server/`)
| Concern | Tech |
|---|---|
| Runtime | Node.js 20 + TypeScript (CommonJS, NodeNext resolution) |
| Web framework | Express |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | zod |
| MQTT broker | **aedes** (embedded, pure-JS) — runs in-process; `MQTT_URL` overrides to external Mosquitto |
| MQTT client | **mqtt** (pub/sub for device + cloud) |

### Infrastructure (free tiers)
| Piece | Host |
|---|---|
| Frontend | Vercel — `https://sed-erp.vercel.app` |
| Backend | Render (free web service) — `https://sed-erp.onrender.com` |
| Database | MongoDB Atlas M0 (db `sederp`) |
| MQTT broker | Embedded aedes inside the Render Node process (no external infra) |

> Render free tier sleeps after ~15 min idle → first request may take ~50 s (cold start). WebSocket works.

---

## 2. Architecture

### Real-time telemetry pipeline (MQTT → Socket.IO)
```
Device simulator                Embedded MQTT broker            Cloud consumer            Browsers
(server/src/simulator)  ──pub──▶  (aedes, in-process)  ──sub──▶  (server/src/mqtt/cloud) ──Socket.IO──▶ Zustand stores
   telemetry/status                                                 alert detection,
   command handling  ◀──sub──── commands / alerts ◀──pub──         command acks
```

- Each simulated machine ("device") publishes telemetry every **2.5 s** and status on change.
- The **cloud consumer** subscribes, keeps a latest-reading map, runs threshold alert detection, and emits a coalesced `iot:update` snapshot every 2.5 s plus `machine:status`, `alert:*`, and `machine:command-ack` events.
- Admin commands: REST → `MachineCommand` (pending) → MQTT publish → device ack → doc updated → `machine:command-ack` broadcast. A **5 s** ack timeout marks the command `timeout`.

### Base URL
```
https://sed-erp.onrender.com/api/v1
```
All responses use the envelope:
```json
{ "success": true,  "data": <payload> }
{ "success": false, "message": "<reason>" }
```

### Auth
Send the JWT on every protected call:
```
Authorization: Bearer <accessToken>
```

---

## 3. Machine details — where each metric lives

There is **no REST endpoint that returns live temperature/OEE** — live values stream over Socket.IO (`iot:update`). REST gives you the registry + alerts + command history.

| You want… | Source |
|---|---|
| Machine registry (name, type, location, gateway, health) | `GET /iot/machines` |
| Live temperature, vibration, throughput, energy, pressure, uptime, **OEE**, status | Socket.IO event **`iot:update`** → `machines[]` |
| Current & past alerts (temp high, vibration spike, fault, admin-sent) | `GET /iot/alerts` |
| Per-machine command/control history | `GET /iot/machines/:id/commands` |

### Live telemetry object (one machine, from `iot:update`)
```json
{
  "machineId": "6a5f2308...",
  "ts": 1737045000000,
  "name": "Roaster 2",
  "type": "Roasting",
  "location": "Plant 1 · Bay 5",
  "status": "running",            // running | idle | fault | off
  "temperature": 71.4,            // °C
  "vibration": 3.2,               // mm/s
  "throughput": 24.8,             // t/h
  "energyUsage": 138,             // kWh
  "pressure": 4.1,                // bar
  "uptime": 96.5,                 // %
  "oeeScore": 84.2                // %
}
```

---

## 4. REST API reference

Legend — **Auth**: 🔓 public · 🔐 JWT required · **Perm**: required permission (admins bypass all).

### 4.1 System
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | 🔓 | Liveness — `{ success, message: "ok" }` |

### 4.2 Auth — `/auth`
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/login` | 🔓 | `{ email, password }` | `{ user, accessToken }` |
| GET | `/auth/me` | 🔐 | — | `{ user }` |

`user` shape: `{ id, name, email, role, active, language, permissions[] }`.

### 4.3 SedIoT — `/iot`

**Machines & telemetry**
| Method | Path | Auth | Perm | Notes |
|---|---|---|---|---|
| GET | `/iot/machines` | 🔐 | — | Machine registry (array) |
| GET | `/iot/alerts?status=` | 🔐 | — | Alerts; optional `status`=`active`\|`ack`\|`resolved` (latest 100) |
| PATCH | `/iot/alerts/:id` | 🔐 | — | Body `{ status }` — acknowledge/resolve an alert |

**Machine control (MQTT command layer)**
| Method | Path | Auth | Perm | Body |
|---|---|---|---|---|
| GET | `/iot/machines/:id/commands` | 🔐 | — | — · returns latest 50 `MachineCommand` |
| POST | `/iot/machines/:id/commands` | 🔐 | `canControlMachines` (power cmds also accept `canPowerCycleMachines`) | `{ command, payload? }` |
| POST | `/iot/machines/:id/alert` | 🔐 | `canSendMachineAlerts` or `canControlMachines` | `{ severity, message, autoDismissMs? }` |
| POST | `/iot/alerts/broadcast` | 🔐 | `canBroadcastAlerts` or `canControlMachines` | `{ severity, message }` |

`command` ∈ `power_on` \| `power_off` \| `restart` \| `set_param` \| `clear_alerts`.
`set_param` payload: `{ key: "maxTemperature" | "maxVibration", value: number }`.
Command POST returns **202** with the `pending` `MachineCommand`; watch `machine:command-ack` for the result.

**Example — power off a machine**
```bash
curl -X POST https://sed-erp.onrender.com/api/v1/iot/machines/<id>/commands \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{ "command": "power_off" }'
```
**Example — set the high-temperature alert threshold to 70 °C**
```bash
curl -X POST .../iot/machines/<id>/commands \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{ "command": "set_param", "payload": { "key": "maxTemperature", "value": 70 } }'
```

### 4.4 SedService — Requests — `/service-requests`
| Method | Path | Auth | Perm | Body / Notes |
|---|---|---|---|---|
| GET | `/service-requests` | 🔐 | — | Admin/`canViewAllRequests` see all; others see own |
| POST | `/service-requests` | 🔐 | `canRequestService` | `{ title, category, description, priority?, machineName?, location }` |
| POST | `/service-requests/:id/quote` | 🔐 | `canViewAllRequests` | `{ amount, notes?, validUntil? }` → status `quoted` |
| POST | `/service-requests/:id/approve` | 🔐 | `canViewAllRequests` | → status `approved`, quote `accepted` |
| POST | `/service-requests/:id/assign` | 🔐 | `canViewAllRequests` | `{ technicianId, scheduledFor? }` → creates a Job, status `assigned` |
| PATCH | `/service-requests/:id/status` | 🔐 | manager sets any; owner may only `cancelled` | `{ status }` |
| GET | `/service-requests/:id/quote` | 🔐 | owner or manager | Returns the linked quote (or null) |
| POST | `/service-requests/:id/respond` | 🔐 | owner only | `{ action: "accept" \| "reject" }` |
| GET | `/service-requests/quotes/all` | 🔐 | `canViewAllRequests` | All quotes (latest 200) |

`category` ∈ `maintenance` \| `repair` \| `installation` \| `consulting` \| `monitoring` \| `parts`.
`priority` ∈ `low` \| `medium` \| `high` \| `critical`.
`status` ∈ `pending` \| `quoted` \| `approved` \| `assigned` \| `in_progress` \| `completed` \| `cancelled`.

### 4.5 SedService — Technicians — `/technicians`
| Method | Path | Auth | Perm | Body |
|---|---|---|---|---|
| GET | `/technicians` | 🔐 | — | — |
| POST | `/technicians` | 🔐 | `canManageTechnicians` | `{ name, email, region, skills?, phone?, status? }` |
| PATCH | `/technicians/:id` | 🔐 | `canManageTechnicians` | partial of the above |
| DELETE | `/technicians/:id` | 🔐 | `canManageTechnicians` | Soft-deactivate (`active=false`) |

`status` ∈ `available` \| `busy` \| `off`.

### 4.6 SedService — Jobs — `/jobs`
| Method | Path | Auth | Perm | Body |
|---|---|---|---|---|
| GET | `/jobs` | 🔐 | — | Latest 200 |
| PATCH | `/jobs/:id/status` | 🔐 | `canManageTechnicians` | `{ status }` — advances the Kanban |

`status` ∈ `scheduled` \| `en_route` \| `on_site` \| `completed`. Completing a job closes its request and frees the technician.

### 4.7 Users & permissions — `/users`
| Method | Path | Auth | Perm | Body |
|---|---|---|---|---|
| GET | `/users` | 🔐 | `canManageUsers` | — |
| PATCH | `/users/:id` | 🔐 | `canManageUsers` | `{ active?, permissions? }` |

Editing `permissions` emits `permission:changed`; editing only `active` emits `user:changed`.

---

## 5. Socket.IO events (server → client)

Connect to the backend origin with the JWT in `auth: { token }`.

| Event | Payload | Emitted when |
|---|---|---|
| `iot:update` | `{ ts, machines: MachineReading[] }` | Every ~2.5 s — live telemetry snapshot |
| `machine:status` | `{ machineId, status }` | A machine's status changes (incl. power on/off) |
| `alert:new` | `Alert` | New/updated alert (auto threshold or admin-sent) |
| `alert:cleared` | `{ id, machineId }` | Alert resolved |
| `machine:command-ack` | `MachineCommand` | Command created (pending) / acked / timed out |
| `service-request:changed` | `ServiceRequest` | Request created or state changed |
| `quote:changed` | `Quote` | Quote issued / accepted / rejected |
| `technician:changed` | `Technician` | Technician created / updated / deactivated |
| `job:changed` | `Job` | Job created / advanced |
| `user:changed` | `User` | User active flag changed |
| `permission:changed` | `User` | User permissions changed (that user's client refreshes abilities) |

---

## 6. MQTT topic layout

| Topic | Direction | QoS | Retained | Purpose |
|---|---|---|---|---|
| `sederp/machines/{id}/telemetry` | device → cloud | 0 | no | Sensor readings (~2.5 s) |
| `sederp/machines/{id}/status` | device → cloud | 1 | yes | Current status |
| `sederp/machines/{id}/commands` | cloud → device | 1 | no | Admin commands |
| `sederp/machines/{id}/ack` | device → cloud | 1 | no | Command acknowledgements |
| `sederp/machines/{id}/alerts` | cloud → device | 1 | no | Targeted alert |
| `sederp/alerts/broadcast` | cloud → all | 1 | no | Global alert |

**Command message** → `{ commandId, command, payload, issuedBy, issuedByName, issuedAt }`
**Ack message** → `{ commandId, status: "ok"|"error", message, ackAt, machineState }`

Broker: embedded **aedes** by default; set `MQTT_URL=mqtt://localhost:1883` to use a real Mosquitto (`brew install mosquitto` / `docker run -d -p 1883:1883 eclipse-mosquitto`).

---

## 7. Data models (Mongoose)

**User** — `name, email, passwordHash(select:false), role(admin|user|technician), active, language, permissions[]`

**Machine** — `name, type, location, gatewayId, online, healthScore, ownerId?`

**Alert** — `machineId, machineName, metric, severity(info|warning|critical), message, status(active|ack|resolved), source(auto|admin), issuedBy?, acknowledgedBy?, resolvedBy?`

**MachineCommand** — `machineId, machineName, command, payload, commandId, issuedBy, issuedByName, issuedAt, ackStatus(pending|ok|error|timeout), ackAt?, ackMessage?`

**Technician** — `name, email, phone?, skills[], region, status(available|busy|off), rating, completedJobs, active`

**ServiceRequest** — `code, title, category, description, priority, machineName?, location, requesterId?, requesterName, status, quoteId?, jobId?`

**Quote** — `requestId, amount, currency, notes?, validUntil?, status(sent|accepted|rejected), createdBy?`

**Job** — `code, requestId, requestTitle, technicianId, technicianName, status(scheduled|en_route|on_site|completed), scheduledFor?, notes?`

All models expose an `id` virtual in JSON.

---

## 8. RBAC permissions

Roles: `admin` (bypasses all permission checks), `user`, `technician`. Granular permissions granted per user by an admin:

| Permission | Grants |
|---|---|
| `canRequestService` | Create service requests |
| `canRequestQuote` | Request a quote |
| `canViewAllRequests` | See all requests + the SedService Admin console |
| `canCancelRequest` | Cancel requests |
| `canRateTechnician` | Rate technicians |
| `canAccessReports` | Access reports |
| `canManageTechnicians` | CRUD technicians + advance jobs |
| `canManageUsers` | Manage users & permissions |
| `canControlMachines` | Any MQTT machine command |
| `canSendMachineAlerts` | Send targeted machine alerts |
| `canPowerCycleMachines` | Power on/off/restart only |
| `canBroadcastAlerts` | Broadcast alerts to all machines |

---

## 9. Environment variables (`server/.env`)

| Var | Default | Purpose |
|---|---|---|
| `PORT` | 5100 | HTTP port |
| `NODE_ENV` | development | env |
| `MONGODB_URI` | local | MongoDB connection string |
| `JWT_SECRET` | dev-secret | JWT signing secret |
| `JWT_EXPIRES_IN` | 7d | token lifetime |
| `CLIENT_URL` | localhost:5173 | comma-separated CORS/Socket.IO origins (set to the Vercel URL in prod) |
| `SEED_ON_BOOT` | true | idempotently seed demo accounts + data on boot |
| `MQTT_URL` | *(unset)* | external broker; unset = embedded aedes |
| `MQTT_BROKER_PORT` | 1883 | embedded broker TCP port |

Client (`client/.env`): `VITE_API_URL`, `VITE_SOCKET_URL`.

---

## 10. Demo accounts (seeded on boot)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@sederp.com` | `Admin@123` |
| User | `user1@sederp.com` / `user2@sederp.com` | `User@123` |
| Technician | `tech1@sederp.com` … `tech3@sederp.com` | `Tech@123` |

Admin holds every permission (including all machine-control permissions).

---

## 11. Local development

```bash
# server
cd server && cp .env.example .env   # fill MONGODB_URI, JWT_SECRET
npm install && npm run dev           # http://localhost:5100

# client
cd client && cp .env.example .env
npm install && npm run dev           # http://localhost:5173
```

Build checks: `cd server && npm run typecheck` · `cd client && npx tsc --noEmit && npm run build`.
