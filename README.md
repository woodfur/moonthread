# Moonthread — Facility Management System

A modern, web-based Facility Management System (FMS) built for non-profit foundations. Moonthread digitises and streamlines facility operations — replacing manual processes with a structured, role-based platform that improves transparency, accountability, and operational efficiency.

## What It Does

Moonthread provides a centralised dashboard for managing every aspect of facility operations:

### 📋 Work Orders & Maintenance
Submit, track, and manage maintenance requests with urgency levels, category tagging, and status workflows. Staff can submit issues with photos, and managers can approve, assign, and track resolution.

### 📦 Asset & Equipment Tracking
Maintain a complete inventory of facility assets — from cleaning equipment to office furniture. Track condition, serial numbers, quantities, purchase dates, and capture photos directly from your device camera.

### 🏢 Vendor & Contract Management
Manage service providers with contact details, ratings, and service categories. Track active contracts with start/end dates, renewal reminders, and contract values.

### 🗓️ Space & Booking Management
Define facility areas (offices, meeting rooms, common areas) and manage bookings. Staff can reserve spaces with purpose, attendee count, and setup requirements.

### 🧹 Supply Requests
Cleaning staff and team members can request supplies with itemised lists (item name, quantity, unit). Requests flow through approval workflows before procurement.

### 💰 Expense Tracking
Record and categorise facility expenditures with approval workflows. Track spending by category (maintenance, cleaning supplies, vendor payments, utilities, equipment).

### 📊 Reports & Analytics
Visual bar charts for work orders by category, expenses by category, and bookings by space — all computed in real-time from your data.

### ⚙️ Settings & User Management
Manage users with role-based access (Admin, Facility Manager, Cleaning Supervisor, Staff). Define and configure facility areas.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Backend / Auth** | Supabase (PostgreSQL, Auth, Row Level Security) |
| **Styling** | Vanilla CSS with custom design tokens |
| **Icons** | Lucide React |

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/woodfur/moonthread.git
cd moonthread
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Database Migrations

Execute the SQL files in your Supabase dashboard (SQL Editor):

1. `supabase/migrations/001_initial_schema.sql` — Creates all tables, RLS policies, and triggers
2. `supabase/migrations/002_add_asset_fields.sql` — Adds asset image and quantity fields

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # All dashboard pages
│   │   ├── assets/         # Asset management + Add Asset form
│   │   ├── vendors/        # Vendors & contracts + forms
│   │   ├── spaces/         # Spaces, bookings + forms
│   │   ├── work-orders/    # Work order management + form
│   │   ├── supply-requests/# Supply request management + form
│   │   ├── expenses/       # Expense tracking + form
│   │   ├── reports/        # Visual analytics
│   │   ├── settings/       # Users & areas management
│   │   └── profile/        # User profile
│   ├── auth/               # Auth server actions
│   ├── api/                # API routes (admin user creation)
│   └── login/              # Login page
├── components/
│   ├── layout/             # Sidebar, Header
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── supabase/           # Supabase client, server, middleware
│   ├── constants.ts        # Labels, mappings
│   └── utils.ts            # Formatting utilities
└── types/                  # TypeScript interfaces
```

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access — manage users, approve expenses, configure system |
| **Facility Manager** | Manage assets, vendors, contracts, work orders |
| **Cleaning Supervisor** | Submit supply requests, manage cleaning-related work orders |
| **Staff** | Submit work orders, book spaces, view dashboards |

## License

MIT
