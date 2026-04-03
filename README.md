# Hivon Blogs — AI-Powered Blogging Platform

A premium, high-performance editorial platform built with **Next.js 14 (App Router)**, **Supabase**, and **Google Gemini AI**. Optimized for speed, visual stability, and a cinematic reading experience.

## ✦ Features

- **Server-Side Rendering (SSR)** — Instant-on page loads with pre-fetched blog data and zero hydration flicker.
- **Cinematic "Ivory Edition" UI** — A bespoke design system using **Instrument Serif** and **Inter** typography, featuring a dynamic circular hero gallery.
- **AI-Powered Summaries** — Gemini 1.5 Flash generates mandatory, professional summaries for every published post.
- **Role-Based Access Control** — Author, Viewer, Admin with strict server-side route protection.
- **Resilient Publishing** — Graceful fallbacks for AI service limits to ensure 100% uptime for content creators.
- **History-Aware Navigation** — Defensive "Fresh Start" logic to ensure a clean state on page refreshes.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (SSR + Client Components) |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| AI Integration | Google Gemini 1.5 Flash API |
| Styling | Vanilla CSS (Ivory Edition Design System) |
| Deployment | **Vercel** (Optimized for Edge/Serverless) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com/app/apikey))

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/hivon-blogs.git
cd hivon-blogs
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set Up the Database
1. Go to your Supabase project → **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the query

> This creates the `users`, `posts`, `comments` tables along with Row Level Security policies.

### 4. Configure Supabase Auth
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to `http://localhost:3000`
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

### 5. Run Locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 👤 User Roles

| Role | Permissions |
|---|---|
| **Viewer** | View posts, read summaries, leave comments |
| **Author** | All Viewer permissions + create/edit own posts |
| **Admin** | All permissions + edit any post, delete posts, monitor comments |

### Demo Admin Credentials
For testing purposes, you can use the following admin account:
- **Email**: `admin@gmail.com`
- **Password**: `admin@`

---

## 🤖 AI Summary Flow

1. Author submits a new blog post
2. The frontend calls `POST /api/generate-summary` with the post body
3. The server calls **Gemini 1.5 Flash** with a summarization prompt
4. The ~200-word summary is returned and saved to `posts.summary` in Supabase
5. Summary is displayed on post cards and post detail pages

**Cost Optimization:** Summaries are generated exactly once at post creation and stored in the database. No repeated API calls are made for the same post.

---

## 🗄 Database Schema

```sql
-- Users (extends Supabase auth)
users: id, name, email, role, created_at

-- Posts
posts: id, title, body, image_url, author_id, summary, created_at, updated_at

-- Comments
comments: id, post_id, user_id, comment_text, created_at
```

---

## 🚢 Deployment (Vercel)

Hivon Blogs is optimized for deployment on **Vercel**.

1. **Connect Repository**: Import the project into Vercel.
2. **Environment Variables**: Add the following in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
3. **Build Settings**: The default Next.js settings will work automatically.
4. **Site URL**: Update your Supabase **Authentication → URL Configuration** to match your Vercel deployment URL (e.g., `https://your-app.vercel.app`).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/generate-summary/   # AI Orchestration
│   ├── HomePageClient.tsx      # Interactive Feed logic
│   ├── page.tsx                # SSR Entry Point
│   ├── globals.css             # Ivory Edition Styles
│   └── ...
├── components/
│   ├── ui/                    # Design System (Skeletons, Gallery)
│   ├── Navbar.tsx
│   └── ...
├── lib/supabase/
│   ├── client.ts               # CSR Client
│   └── server.ts               # SSR Client
├── middleware.ts                # Route Protection
└── ...
```

---

## 🤖 AI Tool Used

This project was built and optimized using **Antigravity** (by Google DeepMind), an AI coding assistant.

**Engineering Highlights:**
- **SSR Migration**: Transitioned the home page to Server-Side Rendering to eliminate hydration flickering and layout shifts.
- **Visual Stability**: Implemented a synchronized `FullPageSkeleton` and architectural z-index hardening for a "FAANG-level" premium UI.
- **AI Service Resilience**: Automated summary generation with non-blocking graceful fallbacks for API quota limits.
- **Clean Architecture**: Enforced strict TypeScript typing and server-side route protection.

---

*Built for Hivon Blogs · 2026*
