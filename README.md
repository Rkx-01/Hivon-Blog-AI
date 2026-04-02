# Hivon Blogs — AI-Powered Blogging Platform

A full-stack blogging platform built with **Next.js 14**, **Supabase**, and **Google Gemini AI**. Built as part of the Hivon Blogs project.

## ✦ Features

- **Role-Based Access Control** — Author, Viewer, Admin with distinct permissions
- **AI-Powered Summaries** — Gemini 1.5 Flash generates ~200-word summaries on post creation
- **Authentication** — Supabase Auth with email/password
- **Blog CRUD** — Create, read, edit, delete posts with featured images
- **Comments System** — Authenticated users can comment; admins can moderate
- **Search & Pagination** — Real-time search + 9-posts-per-page pagination
- **Admin Dashboard** — Manage all posts and comments with stats overview
- **Premium Dark UI** — Inter + Playfair Display typography, glassmorphism navbar

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| AI Integration | Google Gemini 1.5 Flash API |
| Styling | Vanilla CSS (custom design system) |
| Version Control | Git + GitHub |
| Deployment | VPS (PM2 + Nginx) |

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

### Creating an Admin User
1. Register a normal account at `/auth/register`
2. Go to your Supabase dashboard → **Table Editor → users**
3. Find your user and set `role` to `admin`

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

## 🚢 Deployment (VPS with PM2 + Nginx)

### On VPS
```bash
# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# Clone repo
git clone https://github.com/YOUR_USERNAME/hivon-blogs.git
cd hivon-blogs
npm install

# Set environment variables
cp .env.example .env.local
nano .env.local  # fill in your values

# Build
npm run build

# Start with PM2
pm2 start npm --name "hivon-blogs" -- start
pm2 save
pm2 startup
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Update Supabase **Site URL** and **Redirect URLs** to your production domain.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/generate-summary/   # Gemini AI endpoint
│   ├── auth/login/             # Login page
│   ├── auth/register/          # Register page
│   ├── posts/create/           # Create post
│   ├── posts/[id]/             # Post detail
│   ├── posts/[id]/edit/        # Edit post
│   ├── admin/                  # Admin dashboard
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Design system
├── components/
│   ├── Navbar.tsx
│   ├── PostCard.tsx
│   └── CommentSection.tsx
├── context/
│   └── AuthContext.tsx
├── lib/supabase/
│   ├── client.ts               # Browser client
│   └── server.ts               # Server client
│   └── server.ts               # Server client
├── middleware.ts                # Route protection
└── types/index.ts              # TypeScript types
supabase/
└── schema.sql                  # DB schema + RLS
```

---

## 🤖 AI Tool Used

This project was built using **Antigravity** (by Google DeepMind), an AI coding assistant.

**Why Antigravity?** It provided end-to-end code generation with context awareness across the entire project, making architectural decisions, writing boilerplate, and suggesting best practices simultaneously.

**How it helped:**
- Scaffolded the entire Next.js project structure from scratch
- Generated the complete Supabase schema with RLS policies
- Implemented the Gemini AI integration with cost-optimization strategy
- Wrote all React components with proper TypeScript types
- Created the premium dark-mode CSS design system

---

*Built for Hivon Blogs · 2026*
