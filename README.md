# 🦉 Readowl

-----

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
| Alexandre Monteiro Londe | Contributor (React project) |
| Gabriel Lucas Silva Seabra | Contributor (React project) |
| Jussie Lopes da Silva | Contributor (React project) |
| Vitor Gabriel Resende Lopes Oliveira | Contributor (React project) |

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
- **SMTP Configuration**: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` in `.env` for production. In development, emails are logged to the console.
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

**Docker Database URL:**
```env
DATABASE_URL="postgresql://docker:docker@localhost:5432/readowl?schema=public"
```

**Dev script example:**
```json
"dev": "node --loader ts-node/esm --watch src/server.ts"
```

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

## Index

1.  [Branch Naming Convention](https://www.google.com/search?q=%231-branch-naming-convention)
2.  [Local vs. Remote Branches (Origin)](https://www.google.com/search?q=%232-local-vs-remote-branches-origin)
3.  [Development Workflow](https://www.google.com/search?q=%233-development-workflow)
4.  [Commit Convention](https://www.google.com/search?q=%234-commit-convention)
5.  [Pull Request (PR) Process](https://www.google.com/search?q=%235-pull-request-pr-process)

-----

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