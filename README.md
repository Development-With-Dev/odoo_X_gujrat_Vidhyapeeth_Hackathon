# FleetFlow — Fleet & Logistics Management System

> **Odoo x Gujarat Vidyapeeth Hackathon 2026**
> A centralized, rule-based digital hub that replaces inefficient manual logbooks and optimizes your delivery fleet lifecycle.

---

## Table of Contents

- [Overview](#overview)
- [Architecture — Client-Side Rendering (CSR)](#architecture--client-side-rendering-csr)
  - [Why CSR Instead of SSR?](#why-csr-instead-of-ssr)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Authentication & RBAC](#authentication--rbac)
- [Analytics & Reporting](#analytics--reporting)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**FleetFlow** is a full-stack fleet and logistics management application built for the Odoo x Gujarat Vidyapeeth Hackathon. It provides fleet managers, dispatchers, safety officers, and analysts with a unified platform to:

- Track and manage vehicles, drivers, trips, maintenance, fuel logs, and expenses
- Monitor real-time KPIs on an interactive command center dashboard
- Visualize fleet performance through 8 analytical charts (Chart.js)
- Generate one-click PDF, Excel, and CSV reports
- Enforce role-based access control (RBAC) across all operations
- Detect idle/dead-stock vehicles and provide actionable alerts

---

## Architecture — Client-Side Rendering (CSR)

FleetFlow uses a **Client-Side Rendering (CSR)** architecture with a decoupled frontend and backend:

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   index.html ──► main.js ──► Router (hash-based #/path)     │
│                     │                                       │
│              ┌──────┴──────┐                                │
│              │  Page Modules │  (dashboard, vehicles, etc.) │
│              └──────┬──────┘                                │
│                     │                                       │
│              ┌──────┴──────┐                                │
│              │   Store      │  (data.js — single source of  │
│              │   (Client)   │   truth, caches API responses) │
│              └──────┬──────┘                                │
│                     │  fetch('/api/...')                     │
└─────────────────────┼───────────────────────────────────────┘
                      │  HTTP (JSON)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER (:4000)                 │
│                                                             │
│   /api/auth     ──► JWT Authentication                      │
│   /api/vehicles ──► CRUD + Status Management                │
│   /api/drivers  ──► CRUD + License Validation               │
│   /api/trips    ──► Create, Dispatch, Complete, Cancel      │
│   /api/fuel     ──► Fuel Log Tracking                       │
│   /api/maintenance ──► Service Records                      │
│   /api/expenses ──► Operational Expense Tracking            │
│   /api/kpis     ──► Computed KPIs                           │
│   /api/analytics──► Aggregated Analytics Data               │
│   /api/seed     ──► Demo Data Seeding                       │
│                                                             │
│                  Mongoose ODM ──► MongoDB                    │
└─────────────────────────────────────────────────────────────┘
```

**How it works:**

1. The browser loads a single `index.html` file with one `<script>` tag
2. Vite bundles all JavaScript modules and CSS into optimized assets
3. A hash-based router (`#/dashboard`, `#/vehicles`, etc.) handles navigation without page reloads
4. Each page module renders HTML strings into the `#app` container and binds events
5. A centralized `Store` class manages all data, caching API responses in memory
6. API calls go to the Express.js backend via Vite's dev proxy (`/api` → `localhost:4000`)

### Why CSR Instead of SSR?

| Factor | CSR (Our Choice) | SSR (Alternative) |
|--------|-------------------|---------------------|
| **User Experience** | Instant navigation between pages — no full-page reloads. Charts, filters, and dashboards feel responsive and alive | Every click triggers a server round-trip, causing visible page flickers |
| **Real-Time Interactivity** | Chart.js animations, multi-select filters, drag interactions, and counter animations run entirely in the browser with zero latency | Impossible to achieve smooth Chart.js animations when HTML is server-generated |
| **State Management** | Client-side store caches all fleet data — filters, searches, and tab switches are instantaneous | State must be re-fetched or serialized on every request |
| **Server Load** | Server only handles JSON API requests — lightweight and scalable. The Express server focuses purely on data operations | Server must render full HTML pages for every request, increasing CPU/memory usage |
| **Offline Capability** | Cached data allows partial offline usage; the SPA shell remains functional | No server = no page at all |
| **Separation of Concerns** | Frontend (Vite + Vanilla JS) and Backend (Express + MongoDB) are completely decoupled. They can be developed, deployed, and scaled independently | The server handles both data logic and HTML rendering, making the codebase tightly coupled |
| **Deployment Flexibility** | Frontend can be deployed to any CDN/static host (Vercel, Netlify, S3). Backend can be deployed separately (Railway, Render, AWS) | Both must live on the same server instance |
| **Chart & PDF Rendering** | All 8 Chart.js charts render natively in the browser's Canvas API. PDF export captures chart canvases as base64 images — impossible if HTML is server-rendered | Charts would need a headless browser (Puppeteer) on the server, adding heavy dependencies |
| **Build Optimization** | Vite provides tree-shaking, code-splitting, and hot module replacement for fast development | SSR frameworks add complexity (hydration, serialization, async data loading) |
| **SEO** | Not a concern — FleetFlow is a private authenticated dashboard, not a public-facing website | SSR's main advantage is SEO, which is irrelevant for internal tools |

**Bottom line:** FleetFlow is an internal business dashboard — not a public website needing SEO. CSR gives us instant interactivity, smooth animations, and a clean separation between frontend and backend. SSR would add unnecessary complexity with zero benefit for this use case.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Vanilla JavaScript (ES Modules)** | Core application logic — no framework overhead |
| **Vite 7** | Development server with HMR, build tool with tree-shaking |
| **CSS3 (Custom Properties)** | Premium dark theme with 50+ CSS variables, animations, and responsive design |
| **Chart.js 4** | 8 interactive charts (line, bar, doughnut, radar) with custom plugins |
| **Google Fonts (Inter)** | Modern typography |
| **Material Symbols Rounded** | 200+ icons throughout the UI |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js 5** | REST API framework |
| **MongoDB** | NoSQL document database |
| **Mongoose 9** | ODM for MongoDB with schema validation |
| **JWT (jsonwebtoken)** | Stateless authentication tokens |
| **bcrypt.js** | Password hashing (10 salt rounds) |
| **Nodemailer** | Email for password reset OTP flow |
| **CORS** | Cross-origin resource sharing |

### Reporting
| Technology | Purpose |
|------------|---------|
| **SheetJS (xlsx)** | Excel export with 8-sheet workbooks |
| **Canvas API** | Chart capture for PDF embedding |
| **Print API** | Browser-native PDF generation |

---

## Features

### Dashboard (Command Center)
- **4 KPI Cards** — Active Fleet, Maintenance Alerts, Utilization Rate, Pending Cargo
- **3 Financial KPI Cards** — Total Revenue, Fuel Expenses, Maintenance Costs
- **Animated counters** — Numbers count up on page load with easeOutQuart easing
- **Multi-select filters** — Filter by Vehicle Type, Status, and Region simultaneously
- **Active Trips table** — Real-time view of dispatched trips
- **Recent Trips** — Last 5 trips with route, vehicle, and status
- **Fleet Status Overview** — All vehicles with status pills
- **Maintenance Alerts** — Active maintenance warnings
- **Demo Data Seeding** — One-click seed button for fresh databases

### Vehicle Management
- Full CRUD operations (Add, Edit, Delete)
- Vehicle types: Truck, Van, Bike
- Status management: Available, On Trip, In Shop, Retired
- Region assignment (West, East, North, South, Central)
- Odometer tracking and acquisition cost
- Multi-select filtering by type and status

### Driver Management
- Driver registration with license validation
- Status tracking: On Duty, Off Duty, On Trip, Suspended
- Safety score monitoring
- Trip history and performance metrics
- License type validation against vehicle requirements

### Trip Lifecycle
- **Draft → Dispatched → Completed/Cancelled** workflow
- Origin/destination tracking with cargo descriptions
- Revenue recording on completion
- Odometer start/end readings
- Automatic vehicle and driver status updates on dispatch/completion

### Maintenance Tracking
- Service record logging with date, type, and cost
- Status: In Progress, Completed
- Multi-select filters for Status and Service Type
- Vehicle-linked maintenance history

### Fuel & Expense Management
- Fuel log entry with liters, cost/liter, auto-calculated total
- Dynamic trip linking — select a vehicle first, then see only its completed trips
- Expense categorization
- Vehicle-linked expense tracking
- Multi-select vehicle filter

### Analytics & Reports
**8 Interactive Charts:**
1. Revenue & Cost Trend (Dual Line + Area)
2. Cost Distribution (Doughnut with center text plugin)
3. Monthly Trip Volume (Gradient Bar)
4. Fuel Efficiency per Vehicle (Horizontal Bar, color-coded)
5. Last Trip Fuel Cost/km (Bar)
6. Vehicle ROI — Revenue vs Cost (Grouped Horizontal Bar)
7. Monthly Profit Trend (Line with segment coloring)
8. Top Drivers Performance (Radar)

**Dead Stock Alerts:** Identifies vehicles idle for 7+ days with actionable recommendations

**One-Click Reports:**
- **PDF** — Official branded document with letterhead, executive KPI summary, 8 data tables, all charts embedded as images, watermark, confidential footer, and document reference number
- **Excel** — 8-sheet workbook (Summary, Vehicle ROI, Dead Stock, Trips, Fuel, Maintenance, Expenses, Drivers)
- **CSV** — Vehicle ROI data export

### Authentication
- Separate Login and Registration pages
- JWT-based stateless authentication
- Session restoration on page reload
- Role-based access: Manager, Dispatcher, Safety Officer, Analyst
- 3-step Forgot Password flow (Email → OTP → New Password)
- Profile management with password change

---

## Folder Structure

```
odoo_X_gujrat_Vidhyapeeth_Hackathon/
│
├── index.html                  # Single HTML entry point
├── vite.config.js              # Vite dev server + API proxy config
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables (Mongo URI, JWT secret)
│
├── src/                        # Frontend source code
│   ├── main.js                 # App entry — router setup, session restore
│   ├── styles.css              # Complete design system (1900+ lines)
│   │
│   ├── components/
│   │   └── shell.js            # Sidebar + header layout (renderShell)
│   │
│   ├── pages/
│   │   ├── login.js            # Login + Registration + Forgot Password
│   │   ├── dashboard.js        # Command Center with KPIs and filters
│   │   ├── vehicles.js         # Vehicle CRUD + multi-select filters
│   │   ├── trips.js            # Trip lifecycle management
│   │   ├── drivers.js          # Driver management
│   │   ├── maintenance.js      # Maintenance records
│   │   ├── expenses.js         # Fuel logs + expenses
│   │   ├── analytics.js        # 8 charts + dead stock + reports
│   │   └── profile.js          # User profile & password change
│   │
│   ├── store/
│   │   └── data.js             # Centralized state management (Store class)
│   │
│   └── utils/
│       ├── router.js           # Hash-based SPA router
│       └── helpers.js          # formatCurrency, toast, exportPDF/Excel/CSV, animateCounters
│
└── server/                     # Backend API
    ├── server.js               # Express app setup + route mounting
    │
    ├── config/
    │   └── db.js               # MongoDB connection with error handling
    │
    ├── middleware/
    │   └── auth.js             # JWT verification middleware (requireAuth)
    │
    ├── models/
    │   ├── User.js             # User schema (bcrypt hashing, roles)
    │   ├── Vehicle.js          # Vehicle schema (type, status, region)
    │   ├── Driver.js           # Driver schema (license, safety score)
    │   ├── Trip.js             # Trip schema (lifecycle statuses)
    │   ├── Maintenance.js      # Maintenance schema
    │   ├── FuelLog.js          # Fuel log schema
    │   └── Expense.js          # Expense schema
    │
    ├── routes/
    │   ├── auth.js             # Login, register, forgot password, profile
    │   ├── vehicles.js         # Vehicle CRUD + status updates
    │   ├── drivers.js          # Driver CRUD + validation
    │   ├── trips.js            # Trip create, dispatch, complete, cancel
    │   ├── maintenance.js      # Maintenance CRUD
    │   ├── fuel.js             # Fuel log CRUD
    │   ├── expenses.js         # Expense CRUD
    │   ├── kpis.js             # Computed KPI endpoints
    │   ├── analytics.js        # Aggregated analytics data
    │   └── seed.js             # Demo data seeding
    │
    └── utils/
        └── toJSON.js           # Mongoose document formatter (_id → id)
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local installation or MongoDB Atlas cloud)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/Development-With-Dev/odoo_X_gujrat_Vidhyapeeth_Hackathon.git
cd odoo_X_gujrat_Vidhyapeeth_Hackathon

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/fleetflow

# JWT secret for authentication (generate a random 64-char hex string)
JWT_SECRET=your_jwt_secret_here

# Server port
PORT=4000
```

For **MongoDB Atlas** (cloud), use:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

### Running the Application

You need **two terminals** — one for the backend API server and one for the frontend dev server:

**Terminal 1 — Start the API Server:**
```bash
npm run server
# ✅ MongoDB connected: localhost/fleetflow
# FleetFlow API running on http://localhost:4000
```

**Terminal 2 — Start the Frontend Dev Server:**
```bash
npm run dev
# Vite dev server running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

**First-time setup:**
1. Register a new account on the `/register` page
2. Log in with your credentials
3. Click **"Seed Demo Data"** on the dashboard to populate sample vehicles, drivers, trips, etc.

### Production Build

```bash
npm run build     # Outputs optimized static files to /dist
npm run preview   # Preview the production build locally
```

---

## API Reference

All endpoints are prefixed with `/api` and require a `Bearer` token in the `Authorization` header (except auth routes).

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update user profile |
| PATCH | `/api/auth/profile/password` | Change password |
| POST | `/api/auth/forgot-password` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/reset-password` | Reset password with OTP |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List all vehicles |
| POST | `/api/vehicles` | Add a new vehicle |
| PUT | `/api/vehicles/:id` | Update vehicle details |
| PATCH | `/api/vehicles/:id/status` | Update vehicle status |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List all drivers |
| POST | `/api/drivers` | Add a new driver |
| PUT | `/api/drivers/:id` | Update driver details |
| PATCH | `/api/drivers/:id/status` | Update driver status |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List all trips |
| POST | `/api/trips` | Create a new trip (Draft) |
| PATCH | `/api/trips/:id/dispatch` | Dispatch a trip |
| PATCH | `/api/trips/:id/complete` | Complete a trip |
| PATCH | `/api/trips/:id/cancel` | Cancel a trip |

### Fuel, Maintenance, Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fuel` | List fuel logs |
| POST | `/api/fuel` | Add fuel log |
| GET | `/api/maintenance` | List maintenance records |
| POST | `/api/maintenance` | Add maintenance record |
| PUT | `/api/maintenance/:id` | Update maintenance record |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Add expense |

### Utilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kpis` | Get computed KPIs |
| GET | `/api/analytics` | Get aggregated analytics |
| POST | `/api/seed` | Seed demo data |
| GET | `/api/health` | Health check |

---

## Database Models

| Model | Key Fields |
|-------|-----------|
| **User** | username, password (bcrypt), name, role (manager/dispatcher/safety/analyst), companyName, avatar |
| **Vehicle** | name, model, type (Truck/Van/Bike), licensePlate, maxCapacity, odometer, region, status, acquisitionCost |
| **Driver** | name, phone, licenseType, licenseExpiry, status (On Duty/Off Duty/On Trip/Suspended), safetyScore, tripsCompleted |
| **Trip** | vehicleId, driverId, origin, destination, cargoDescription, status (Draft/Dispatched/Completed/Cancelled), startOdometer, endOdometer, revenue |
| **FuelLog** | vehicleId, tripId, liters, costPerLiter, totalCost, date |
| **Maintenance** | vehicleId, type, description, cost, date, status (In Progress/Completed) |
| **Expense** | vehicleId, category, description, amount, date |

---

## Authentication & RBAC

FleetFlow implements **Role-Based Access Control** with four roles:

| Role | Description |
|------|-------------|
| **Manager** | Full access to all modules, vehicle retirement, driver suspension |
| **Dispatcher** | Trip creation, dispatch, and completion. Vehicle and driver assignment |
| **Safety Officer** | Driver safety score monitoring, maintenance oversight |
| **Analyst** | Read-only access to analytics, reports, and KPI dashboards |

Authentication flow:
1. User registers with username, password, display name, role, and company
2. On login, server returns a **JWT token** (stored in `localStorage`)
3. Every API request includes the token in `Authorization: Bearer <token>` header
4. The `requireAuth` middleware verifies the token and attaches the user to `req.user`
5. Session restoration checks stored token validity on page reload

---

## Analytics & Reporting

### Charts (Chart.js 4)
All charts use a premium dark theme with custom plugins:

- **Crosshair Plugin** — Shows a vertical dashed line on hover (line/bar charts only)
- **Center Text Plugin** — Displays total cost in the center of the doughnut chart
- **Color-coded bars** — Fuel efficiency uses green/yellow/red based on performance vs average
- **Segment coloring** — Profit trend line turns red when profit goes negative

### PDF Export
The PDF is generated as an official branded document with:
- Branded letterhead (FleetFlow logo, company info)
- Auto-generated document reference number (e.g., `FF-RPT-M2K8F9J`)
- Executive summary KPI cards
- 8 data tables with styled headers and alternating rows
- All 8 charts embedded as PNG images
- "CONFIDENTIAL" footer with copyright notice
- FLEETFLOW watermark
- A4 landscape layout optimized for print

---

## Demo Accounts

After seeding demo data, you can register with any credentials. Roles available:

| Role | Description |
|------|-------------|
| Manager | Full administrative access |
| Dispatcher | Trip and fleet operations |
| Safety | Driver safety monitoring |
| Analyst | Analytics and reporting |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the **ISC License**.

---

<p align="center">
  <strong>FleetFlow</strong> — Built with ❤️ for the Odoo x Gujarat Vidyapeeth Hackathon 2026
</p>
