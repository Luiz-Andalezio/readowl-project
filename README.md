# 🦉 Readowl

A web platform for publishing and reading books, focused on promoting amateur literature in Brazil and connecting readers with aspiring writers.  
Developed using **Next.js**, **TypeScript**, and **Tailwind CSS**.

-----

## 📋 About the Project

**Readowl** was created to provide a welcoming space for new writers and strengthen the literary culture in Brazil.  
The platform aims to solve common issues found in other systems, such as inefficient promotion and confusing interfaces, by offering a reliable environment for authors to publish their works for free and receive feedback.

### 👥 Project Team

| Name | Role |
|---|---|
| Luiz Alberto Cury Andalécio | Author & Main Developer (Next Project) |
| Alexandre Monteiro Londe | Contributor (React Project) |
| Gabriel Lucas Silva Seabra | Contributor (React Project) |
| Jussie Lopes da Silva | Contributor (React Project) |
| Vitor Gabriel Resende Lopes Oliveira | Contributor (React Project) |

*The contributors above are developers from a separate pure React project who provide indirect support and insights to the development of this Next.js project.*


### 🎯 Main Features

- User registration and login with secure authentication and password recovery.
- Create, view, edit, and delete books, volumes, and chapters.
- Advanced search system with filters by genre, popularity, and date.
- Personal library to favorite works and receive notifications.
- Interaction through ratings, likes, and comments on books and chapters.
- Admin panel for user management and content moderation.

### 🛠️ Technologies Used

#### **Frontend**
- **Next.js**: React framework for server-side rendering, routing, and API routes.
- **Next Router**: Built-in routing for navigation (Home, Book, Profile, etc.).
- **Tailwind CSS**: Fast, responsive styling following the visual identity.
- **TanStack Query**: Backend communication, caching, and data updates.
- **React Hook Form**: All forms (login, registration, publishing).
- **TipTap**: Rich text editor for authors to write chapters.

#### **Backend**

- **Node.js (Next.js API Routes)**: Handles server-side logic and API endpoints.
- **TypeScript**: Ensures type safety and reduces bugs.
- **Prisma**: ORM for seamless PostgreSQL integration.
- **Zod**: Unified data validation across frontend and backend.
- **JWT + Bcrypt.js**: Secure authentication and password hashing.
- **Session Management**: Supports "Remember Me" with JWT and NextAuth, offering 8-hour default sessions or 30 days when enabled. Session TTL is enforced via middleware using token flags (`remember`, `stepUpAt`).
- **File Uploads**: Uses Multer and Cloudinary for storing book covers and profile images.
- **Email Services**: Nodemailer for password recovery, with HTML templates and plain-text fallback. Password reset flow uses single-use SHA-256 tokens (30-minute expiry) and session invalidation via `credentialVersion`.
- **Security**: Per-user cooldown (120s) and IP rate limiting (5 requests/15min) on password recovery requests.
- **SMTP Configuration**: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` in `.env`. In development, if SMTP is not configured, emails are logged to the console.
- **Redis (Optional)**: For distributed rate limiting, configure `REDIS_URL` or Upstash variables; defaults to in-memory if unset.
- **UX Enhancements**: Success page after password reset and improved feedback messages.
- **Password Strength**: `PasswordStrengthBar` uses a local heuristic and optionally loads `zxcvbn` for enhanced feedback.
- **Environment Variables**: See `.env.example` for required settings.

#### **Database**
- **PostgreSQL**: Data storage.

#### **Environment**
- **Docker**: Containerization for development and deployment.
- **Git**: Version control.
- **VS Code**: Recommended editor.

**VS Code Extensions:** Prisma, ESLint, Prettier - Code formatter, Tailwind CSS IntelliSense, EchoAPI

-----

## 🚀 Getting Started (from scratch)

This guide walks you from zero to running the app locally with a Dockerized PostgreSQL dedicated to this Next.js project. If you already run pgAdmin for the React project (container name: `readowl_pgadmin`), keep using it; we don't run a second pgAdmin here. It also covers Google OAuth login and SMTP for password recovery.

### 1) Prerequisites

- Node.js 18+ and pnpm or npm
- Docker Desktop or Docker Engine
- A PostgreSQL instance (local/native or in Docker). If you already have one, you can keep using it.
- Optional: Google Cloud project for OAuth2 (we provide example credentials for local dev)

### 2) Clone and install dependencies

```bash
git clone <your-repo-url>
cd readowl-next
npm install
```

### 3) Environment variables

Copy `.env.example` to `.env` and fill values. For local development, an example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/readowl-next_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<a-strong-random-secret>"

# Google OAuth
GOOGLE_CLIENT_ID="<google-client-id>"
GOOGLE_CLIENT_SECRET="<google-client-secret>"

# SMTP (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="<your-gmail>@gmail.com"
SMTP_PASS="<app-password>"
MAIL_FROM="Readowl <no-reply@readowl.dev>"
```

Notes:
- For Gmail SMTP, use an App Password (not your normal password). Enable 2-Step Verification and create an App Password.
- The project includes a `credentials/google-oauth.json` template. We ignore the `credentials/` folder in Git to avoid leaking secrets.

### 4) Database

We ship a dedicated Postgres service for this project via Docker Compose. It exposes port `5433` on your host, so it won’t conflict with other Postgres instances.

Bring it up:

```bash
docker compose up -d postgres
```

Details:
- Container name: `readowl_next_db`
- Database: `readowl`
- User/Password: `readowl` / `readowl`
- Host port: 5433 (container 5432)

Your `.env` should already point `DATABASE_URL` to `postgresql://readowl:readowl@localhost:5433/readowl?schema=public`.

If you want to manage the DB via GUI, you have two options:

- Reuse the existing pgAdmin from the React project (container `readowl_pgadmin`) at http://localhost:5050; or
- Use the built-in pgAdmin service included in this project's docker-compose at http://localhost:5051.

#### Using the built-in pgAdmin (Option 3)

We include a `pgadmin` service in `docker-compose.yml`. To start it alongside Postgres:

```bash
docker compose up -d postgres pgadmin
```

Access http://localhost:5051 and log in using the credentials defined in your `.env`:

```env
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin
```

Notes:
- These variables are optional; if not set, the defaults above are used.
- On Linux, we map `host.docker.internal` inside the container to reach the Postgres running on the host ports.

Create the server inside pgAdmin:
1. Right-click “Servers” > Create > Server…
2. General tab: Name: `readowl-local`
3. Connection tab:
        - Host: `host.docker.internal` (from inside pgAdmin container)
        - Port: `5433`
        - Maintenance DB: `readowl`
        - Username: `readowl`
        - Password: `readowl`
4. Save

#### Create a server in pgAdmin (GUI steps)

1. Open http://localhost:5051 and log in.
2. Right-click “Servers” > Create > Server…
3. General tab: Name: `readowl-local`
4. Connection tab:
   - Host: If pgAdmin is in Docker and Postgres is on the host, use your host IP (Linux) or `host.docker.internal` (Mac/Windows). If both are in Docker, `host.docker.internal` also works in many setups.
   - Port: `5433`
   - Maintenance DB: `readowl`
   - Username: `readowl`
   - Password: `readowl`
   - Save
5. Expand the server > Databases. The default DB `readowl` should exist. If not, create it.

### 5) Prisma setup

Generate and apply the schema to your database:

```bash
npx prisma generate
npx prisma migrate deploy
# For first-time dev setup (optional) use:
# npx prisma migrate dev
```

### 6) Google OAuth setup

In Google Cloud Console (APIs & Services > Credentials), create OAuth 2.0 Client ID for Web application:
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

Copy Client ID and Secret to `.env` (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`).

### 7) SMTP (password recovery)

If using Gmail:
- Enable 2-Step Verification
- Create an App Password and set it in `.env` as `SMTP_PASS`
- Keep `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`

### 8) Run the app

```bash
npm run dev
```

Open http://localhost:3000

### 9) Troubleshooting

- Check `.env` values and database connectivity.
- If using Dockerized Postgres, ensure the port mapping matches your `DATABASE_URL`.
- Prisma fails to connect: verify DB exists and credentials are correct.
- Gmail EAUTH/535: use an App Password, not the normal password. Consider port 465 with `SMTP_PORT=465` for SSL.

### 10) Full reset (Docker + Prisma)

Use these steps if you want to completely reset containers, volumes and Prisma migrations/state for this Next.js project only.

1. Stop and remove containers (pgAdmin and Postgres):

        ```bash
        docker rm -f readowl_next_pgadmin readowl_next_db 2>/dev/null || true
        ```

2. Remove volumes (wipes data):

        ```bash
        docker volume rm -f readowl-next_readowl_next_pgdata 2>/dev/null || true
        ```

3. Clear Prisma migrations (squash to a fresh baseline):

        ```bash
        rm -rf prisma/migrations/*
        ```

4. Bring Postgres back and recreate migrations:

        ```bash
        docker compose up -d postgres
        npx prisma generate
        npx prisma migrate dev --name init
        ```

5. (Optional) Bring up pgAdmin again:

        ```bash
        docker compose up -d pgadmin
        ```

6. Log into pgAdmin (http://localhost:5051) with `.env` credentials:

        ```env
        PGADMIN_DEFAULT_EMAIL=admin@example.com
        PGADMIN_DEFAULT_PASSWORD=admin
        ```

If login fails with "incorrect password", remove the existing pgAdmin container to allow the new credentials to take effect and start it again (step 1 then 5).

-----

## 🧰 Development notes

- Tech stack: Next.js (App Router), TypeScript, Tailwind CSS, Prisma, NextAuth, Zod, Nodemailer.
- We added a `docker-compose.yml` entry for pgAdmin to simplify DB management in development.

### 📑 Screens: Completed & To-Do

| ✅ **Completed Screens** | Details |
|---|---|
| 🏠 Landing Page | Header, terms, and infos |
| 🔐 Login & Registration | Simple login/registration with passoword recovery and Google sign in option |
| 📖 Book Index | Book details, follow option, rating, volumes dropdown with chapter list |
| 📄 Chapter Index | Principal content and crud buttons |
| 📚 Library | Carousel of created books |
| 📝 Book CRUD | Full create, view, edit, delete |
| 📦 Volume & Chapter CRUD | Create, edit, delete volumes and chapters |
| ⚠️ Error Pages | 403, 404, 500 and generic errors |

| 🚧 **Screens To-Do** | Details |
|---|---|
| 🏡 Home Page | Banner carousel, featured carousels, recent chapters list |
| 🔎 Book Search | With filters |
| 📚 Followed Books Carousel | In library |
| 💬 Comments Tab | On book index |
| 📄 Chapter Index | Reactions-based rating and comments |
| 🔔 Notifications | For created and followed books |
| 👤 User Profile Edit | User self-edit screen |
| 🛠️ Admin User Edit | General user management for admins |

> 62% complete

### 📁 Suggested Project Structure

- `docs/` – Project documentation and diagrams.
- `prisma/` – Prisma schema and database migrations.
- `public/` – Static assets served as-is (images, icons, fonts, SVGs).
- `src/` – Application source code.
        - `app/` – Next.js App Router: pages, layouts, and API routes under `app/api`.
        - `components/` – Reusable UI and feature components (e.g., book, ui, sections).
        - `lib/` – Application libraries and utilities (Prisma client, auth, mailer, rate limiters, slug helpers).
        - `types/` – Global TypeScript types and module augmentations (e.g., NextAuth, zxcvbn).

-----

## 📓 Commit Convention

This repository follows a variation of the [Conventional Commits](https://www.conventionalcommits.org/) standard. This approach helps keep the commit history clear and organized, and contributes to version automation and changelog generation.

### ✔️ Format

```bash
<type>(scope):<ENTER>
<short message describing what the commit does>
```

### 📍 What is the "type"?

    * `feat`: New feature
    * `fix`: Bug fix
    * `docs`: Documentation changes
    * `style`: Styling adjustments (css, colors, images, etc.)
    * `refactor`: Code refactoring without behavior change
    * `perf`: Performance improvements
    * `test`: Creating or modifying tests
    * `build`: Changes that affect the build (dependencies, scripts)
    * `ci`: Continuous integration configurations

### 📍 What is the "scope"?

Defines the part of the project affected by the commit, such as a module (`encryption`), a page (`login-page`), or a feature (`carousel`).

### 📝 Example

```bash
git commit -am "refactor(encryption):
> Improves indentation."

git commit -am "fix(login-page):
> Fixes null login bug."

git commit -am "feat(carousel):
> Implements carousel on the home page."
```

-----

## 🪢 Branching Convention

This document describes the versioning and branch organization standard for the Readowl project, using Git for a more organized and traceable workflow.

### 1. Branch Naming Convention

Every new branch created for task development should strictly follow the pattern below to ensure consistency and clarity about the purpose of each branch.

**Pattern:** `<short-lowercase-description-with-hyphens>`

The description should be short and use hyphens to separate words.

**Branch name examples:**

- `landing-page`
- `backend-configuration`
- `login-form`

**Command to create a branch:**

To create a new branch from `dev` and switch to it:

```bash
git checkout -b landing-page
```

### 2. Local vs. Remote Branches (Origin)

It's important to understand the difference between a branch on your machine (local) and the branch on the remote repository (origin).

- **Local Branch:** A version of the repository that exists only on your computer. This is where you work, develop code, test, and make commits.
- **Remote Branch (origin):** The version of the branch stored on the central server (like GitHub, GitLab, etc.). It serves as a synchronization point for all team members.

Although your local branch and the corresponding remote branch have the **same name** (e.g., `landing-page`), they are different entities. You develop on your local branch, and when you want to share your progress or back up your work, you push your commits to the remote branch using `git push`.

**Basic workflow:**

1. You create the `landing-page` branch **locally**.
2. You develop and commit on this local branch.
3. You push your changes to the remote repository with `git push`.

> Note: The `-u` (or `--set-upstream`) parameter links your local branch to the newly created remote branch, making future `git push` and `git pull` commands easier.

### 3. Development Workflow

1. **Sync your local `dev` branch:**
        ```bash
        git checkout dev
        git pull origin dev
        ```
2. **Create your task branch:**
        Create your local branch from the updated `dev`, following the naming convention.
        ```bash
        git checkout -b login-form
        ```
3. **Develop and commit:**
        Work on the code and make clear, concise commits. Remember to follow the commit convention.
        ```bash
        git add .
        git commit -m "feat(login-form):
        > Adds field validation"
        ```
4. **Push your work to the remote repository:**
        Push your commits to the remote branch with the same name.
        ```bash
        git push origin -u login-form
        ```

### 4. Follow the Commit Convention

[See the detailed commit convention above](#commit-convention) to ensure your messages are clear, traceable, and always reference the relevant part of the project.

### 5. Pull Request (PR) Process

A Pull Request (PR) is the mechanism for reviewing and integrating code from one branch into another.

- **When finishing a task:**
        When development on your task branch (e.g., `login-form`) is complete and tested, you should open a **Pull Request** from your branch to the `dev` branch.
        This serves to:
        1. Allow code review by other team members.
        2. Keep a historical record of all integrated changes.
        3. Make the task's code available in `dev` for other developers if needed.

- **At the end of a Sprint:**
        The `main` branch is the production branch and should only contain stable, tested code. Updates to `main` occur only at the end of each development cycle (Sprint).
        At the end of the sprint, a **Pull Request** will be opened from the `dev` branch to the `main` branch, containing all features and fixes developed during the cycle.

-----