# **Project Plan: Readowl**

**Final Project - Software Engineering**

  - **Date:** July 29, 2025
  - **Authors:** Luiz Alberto Cury Andalécio.

-----

## **Table of Contents**

1.  [Introduction](https://www.google.com/search?q=%231-introduction)
2.  [System Overview](https://www.google.com/search?q=%232-system-overview)
      - [General Objective](https://www.google.com/search?q=%23a-general-objective)
      - [Specific Objectives](https://www.google.com/search?q=%23b-specific-objectives)
      - [Solution Summary](https://www.google.com/search?q=%23c-solution-summary)
3.  [Product Backlog - User Stories](https://www.google.com/search?q=%233-product-backlog---user-stories)
      - [User Stories](https://www.google.com/search?q=%2331-user-stories)
      - [Epics / Features](https://www.google.com/search?q=%2332-epics--features)
      - [Tasks for Each Epic](https://www.google.com/search?q=%2333-tasks-for-each-epic)
4.  [Use Case Diagram](https://www.google.com/search?q=%234-use-case-diagram)
5.  [BPMN / Activity Diagram](https://www.google.com/search?q=%235-bpmn--activity-diagram)
6.  [Visual Identity](https://www.google.com/search?q=%236-visual-identity)
7.  [Architecture and Technologies](https://www.google.com/search?q=%237-architecture-and-technologies)
      - [Architecture](https://www.google.com/search?q=%23a-architecture)
      - [Technologies](https://www.google.com/search?q=%23b-technologies)
8.  [Environment and Configuration](https://www.google.com/search?q=%238-environment-and-configuration)
      - [Development Environment](https://www.google.com/search?q=%23a-development-environment)
      - [Configuration Steps](https://www.google.com/search?q=%23b-configuration-steps)
      - [Deployment Proposal](https://www.google.com/search?q=%23c-deployment-proposal)

-----

## **1. Introduction**

This document presents the Project Plan for **Readowl**, a software developed to foster the amateur literature scene in Brazil. It will serve as the primary guide for all phases of the system's development, containing the guidelines, requirements, diagrams, visual identity, architecture, and environment necessary for the product's construction.

Currently, considering all types of reading from newspapers to self-help books, only about 45% of the Brazilian population has a reading habit. When the focus shifts to fictional stories, this number drops drastically, revealing a scarce niche within an already under-cultivated custom. Consequently, the number of authors willing to offer quality narratives has also been decreasing. After all, if few people are accustomed to reading, why write and publish a work?

However, the problem extends beyond a lack of readers or writers: finding a reliable platform where an author can publish their work for free and receive some financial support is still a considerable challenge, especially when the target audience is Brazilian. Existing platforms mostly have flaws that frustrate readers, writers, and even administrators—be it a poorly customizable reading system, inefficient (and often unfair) promotion, an approval process that can generate conflicts between reviewers and writers, or a confusing publishing interface. All this discourages those who wish to create and share.

Thus, considering these complications, **Readowl** was born: a software created to welcome beginner writers and grow the literary culture in Brazil.

-----

## **2. System Overview**

### **a. General Objective**

To develop a book publishing and reading platform with the purpose of connecting readers with beginner writers, increasing the visibility of their works, and strengthening the Brazilian amateur literature scene. By encouraging new authors and increasing interest in writing, the system also contributes to the development of future professional writers, thereby elevating the quality and reach of national literary production.

### **b. Specific Objectives**

#### **Basic Structure and Access**

  - A Landing Page to welcome visitors, present the site's proposal, and encourage registration.
  - A secure registration and login system with authentication and password recovery.
  - A home screen for logged-in users with quick access to features, settings, and support.
  - User profile configuration with options to edit information, set privacy, and upload a profile picture.

#### **Publication and Organization of Works**

  - CRUD (Create, Read, Update, Delete) functionality for books.
  - CRUD functionality for volumes to organize chapters.
  - CRUD functionality for chapters with a formatted text editor (bold, italics, headers, images).
  - A draft and publication system, allowing authors to save texts without publishing them immediately.

#### **Content Discovery and Interaction**

  - An automated showcase of featured books and chapters on the user's home page with content filters for popularity, rating, date, and literary genre.
  - An advanced search system by title, author, genre, and status (in progress, complete).
  - A personal library/favorites system for readers to save works of interest.
  - Notifications for favorited/followed works.

#### **Engagement and Feedback**

  - A rating system for readers to leave scores on books.
  - An overall rating for each work, calculated automatically based on the average of user ratings.
  - "Likes" for chapters and books.
  - CRUD functionality for comments on book pages and within chapters to promote interaction.

#### **Educational Content and Support**

  - A section for articles and tutorials with writing tips from a guide.
  - A help center/FAQ with answers to common questions and platform usage tutorials.

#### **Administration and Moderation**

  - User management for administrators (editing, blocking, password reset).
  - Content moderation for analyzing and removing inappropriate works or comments.
  - A reporting system for users to report content that violates the rules.

### **c. Solution Summary**

Readowl will be a responsive web application offering an intuitive experience for both readers and writers. The system will be developed using **Next.js**, leveraging its powerful full-stack capabilities to create a modern, performant, and scalable platform. The architecture will utilize Next.js's App Router, combining server-side rendering (SSR) for performance and SEO with client-side interactivity. Development will follow agile methodologies (Scrum) for continuous organization and delivery.

-----

## **3. Product Backlog - User Stories**

### **3.1 User Stories**

| ID | User Story | Priority |
|----|------------|----------|
| 1 | As a visitor, I want to view a Landing Page that presents the site's proposal, so I can understand the benefits before registering. | High |
| 2 | As a visitor, I want to create an account simply and securely, so I can access the platform's features. | High |
| 3 | As a visitor, I want to log in with secure authentication and have a password recovery option, to ensure continuous access to my account. | High |
| 4 | As a user, I want to access a personalized home screen after logging in, so I can easily find my functions and content in a navbar. | High |
| 5 | As a user, I want to configure my profile, changing personal information, photo, and privacy, to present myself as I wish. | High |
| 6 | As an author, I want to create, view, edit, and delete my books, to manage my published works. | High |
| 7 | As an author, I want to create, edit, and delete volumes, to organize chapters logically. | High |
| 8 | As an author, I want to create, edit, and delete chapters using a formatted text editor, to improve the content's presentation. | High |
| 9 | As an author, I want to save chapters as drafts before publishing, to review and improve my text before making it available. | Low |
| 10 | As a user, I want to see featured books and chapters on my home page, to discover new content. | High |
| 11 | As a user, I want to search and filter works by name, popularity, rating, date, and genre, to find readings that interest me. | Medium |
| 12 | As a user, I want to see error pages, in case I encounter a faulty page. | Low |
| 13 | As a reader, I want to save books to my library/favorites, to follow them in the future. | Medium |
| 14 | As a reader, I want to receive notifications about new chapters or updates to the books I follow, to stay informed. | Low |
| 15 | As a reader, I want to rate books by assigning scores and a general comment, to help other readers and give feedback to the author. | High |
| 16 | As the system, I want to count the views of each chapter and display the total on the book's main page, to show a fair ranking. | Medium |
| 17 | As a reader, I want to like chapters, to show that I enjoyed the content. | Medium |
| 18 | As a reader, I want to comment on a book's chapter, to interact with the author and other readers. | High |
| 19 | As a visitor or user, I want to access articles and tutorials, including a writing guide, to learn and improve my literary production. | Low |
| 20 | As a user, I want to access a help center/FAQ, to find quick answers to my questions. | Low |
| 21 | As an administrator, I want to view, edit, block, and reset user passwords, to keep the community safe. | High |
| 22 | As a user, I want to report books, chapters, or comments, to help maintain a healthy environment. | Low |
| 23 | As an administrator, I want to review and remove inappropriate works or comments, to preserve content quality. | Medium |

### **3.2 Epics / Features**

| Epic / Feature | Related Stories | Priority |
|----------------|-----------------|----------|
| 1st - Basic Structure and Access | 1, 2, 3, 4, 5 | High |
| 2nd - Book Publishing | 6, 7, 8, 9 | High |
| 3rd - Book Discovery | 10, 11, 13, 14 | High |
| 4th - Reader Feedback | 15, 16, 17, 18 | High |
| 5th - Support | 12, 19, 20 | Medium |
| 6th - Administration | 21, 22, 23 | High |

### **3.3 Tasks for Each Epic**

#### **1st Epic - Basic Structure and Access**

  - **Task 1: Design and Implement the Landing Page**
      - Sub-tasks: Define visual structure (wireframe), develop with Next.js/React and Tailwind CSS, implement animations, integrate links for login/registration, optimize for SEO.
  - **Task 2: Implement User Registration and Login System**
      - Sub-tasks: Create registration/login forms with client-side validation, implement API Route Handlers for user creation and authentication, implement password hashing (e.g., bcrypt), manage sessions securely (e.g., Next-Auth.js), write unit and integration tests.
  - **Task 3: Implement Password Recovery via Email**
      - Sub-tasks: Create password reset request form, implement email sending with a secure link (e.g., Nodemailer), create the password reset page, validate the reset token in the backend.
  - **Task 4: Create the Main Navbar for Logged-in Users**
      - Sub-tasks: Design layout, create links for main features (home, search, notifications, profile, publish).
  - **Task 5: Implement User Profile CRUD**
      - Sub-tasks: Create profile editing page, implement profile picture upload, add fields for bio, social media, and reading preferences.

#### **2nd Epic - Book Publishing**

  - **Task 1: Implement Book CRUD**
      - Sub-tasks: Create form page for book creation/editing (title, synopsis, genre, cover), implement cover image upload and compression, create secure deletion endpoint.
  - **Task 2: Implement Volume CRUD**
      - Sub-tasks: Create form page for volume creation/editing, create secure deletion endpoint, list volumes alphabetically within their respective books.
  - **Task 3: Implement Chapter CRUD with a Formatted Text Editor**
      - Sub-tasks: Create page listing created chapters, create form for chapter creation/editing, integrate a rich text editor (e.g., TipTap), implement "Save as Draft" functionality.

#### **3rd Epic - Book Discovery**

  - **Task 1: Develop Automated Showcase for Books and Chapters**
      - Sub-tasks: Implement carousels for featured content by popularity, latest releases, and rating; create a list of recent chapter releases.
  - **Task 2: Implement Content Filters and Search**
      - Sub-tasks: Create a search form with dropdowns for genre, status, and date; implement the backend logic to return filtered results.
  - **Task 3: Implement Personal Library/Favorites**
      - Sub-tasks: Create a "Follow" button, create a personal library page displaying followed books, allow for custom filtering.
  - **Task 4: Implement Notification System**
      - Sub-tasks: Create a notifications table in the database, implement a mechanism to generate notifications for new chapters, create a page/list to display notifications.

#### **4th Epic - Reader Feedback**

  - **Task 1: Implement Rating System**
      - Sub-tasks: Create a star-rating component, implement a comment/review CRUD, allow only one rating per user per book, allow admins to remove ratings.
  - **Task 2: Implement Automatic Calculation of Overall Rating and Views**
      - Sub-tasks: Create a function to calculate the average rating, update the overall rating upon new submissions, implement a view counter for each chapter.
  - **Task 3: Implement "Likes" for Chapters**
      - Sub-tasks: Create a like button with a counter, create a database table to associate likes with users, allow users to unlike content.
  - **Task 4: Implement Comment CRUD for Chapters**
      - Sub-tasks: Create a comment submission field, list comments with pagination, allow authors and admins to delete comments.

#### **5th Epic - Support**

  - **Task 1: Implement Custom Error Pages**
      - Sub-tasks: Create custom components for 404 (Not Found) and 500 (Server Error) pages.
  - **Task 2: Create Articles and Tutorials Page**
      - Sub-tasks: Create a CRUD interface for articles visible only to administrators, structure the article listing, create a page for individual article viewing.
  - **Task 3: Create a Help/FAQ Footer**
      - Sub-tasks: Implement a site footer with links to navigation, FAQs, social media, and creator information.

#### **6th Epic - Administration**

  - **Task 1: Create a User Management Dashboard for Admins**
      - Sub-tasks: Implement a page listing all registered users, create forms for editing user information, add a button for account deletion.
  - **Task 2: Implement a Reporting System**
      - Sub-tasks: Add a "Report" button to books, chapters, and comments; create a `reports` table in the database.
  - **Task 3: Create a Content Moderation Dashboard for Admins**
      - Sub-tasks: Create a page listing all reported content, add functionality to approve or remove the content.

-----

## **4. Visual Identity**

### **Readowl Visual Identity**

  - **Name:** Readowl - a fusion of "read" and "owl," symbolizing wisdom and knowledge gained through reading.
  - **Slogan:** "Cultivating literature for any place."
  - **Mascot:** A wizard owl.

#### **Main Colors:**

  - Purple: `#6750A4`
  - Medium Purple: `#836DBE`
  - Dark Purple: `#23004B`
  - Light Purple: `#9E85E0`
  - White: `#FFFFFF`
  - Purplish White: `#F0EAFF`

#### **Typography:**

  - **Informative Content:** Poppins
  - **Reading Content:** Yusei Magic

#### **Buttons:**

  - Rounded, with icons and subtle animations on hover for an interactive and friendly user experience.

-----

## **5. Architecture and Technologies**

### **a. Architecture**

The application will be built using the **Next.js App Router** architecture. This modern, full-stack approach allows for a seamless integration of frontend and backend logic within a single framework. Key architectural features include:

  - **Server Components:** For rendering static and dynamic content on the server, ensuring fast page loads and excellent SEO.
  - **Client Components:** For delivering rich, interactive user experiences where needed.
  - **File-System Based Routing:** For intuitive and organized route management.
  - **API Route Handlers:** To build the backend API for handling data mutations, authentication, and business logic.

### **b. Technologies**

#### **Framework**

  - **Next.js:** The core React framework for building the full-stack application.

#### **Frontend**

  - **React:** For building user interfaces with the component model.
  - **Tailwind CSS:** For rapid, utility-first styling and creating a responsive design.
  - **React Hook Form:** For building robust and performant forms (login, registration, publishing).
  - **TipTap:** A headless rich text editor for authors to write and format their chapters.
  - **Framer Motion:** (Optional) For creating smooth animations and visual effects.

#### **Backend (via Next.js API Routes)**

  - **TypeScript:** To add static typing, improving code quality and preventing bugs.
  - **Prisma:** A next-generation ORM for communicating with the PostgreSQL database.
  - **Zod:** For robust data validation across both the frontend and backend.
  - **Next-Auth.js:** For handling authentication, sessions, and security.
  - **Multer + Cloudinary:** For uploading and storing book covers and profile pictures.
  - **Nodemailer:** For sending emails, such as for password recovery.

#### **Database**

  - **PostgreSQL:** For storing all application data.

-----

## **6. Environment and Configuration**

### **a. Development Environment**

  - **Editor:** VS Code
  - **Version Control:** Git + GitHub
  - **Package Manager:** npm or yarn
  - **Containerization:** Docker (for PostgreSQL database)

### **b. Configuration Steps**

1.  Clone the repository from GitHub.
2.  Install dependencies: `npm install`
3.  Set up the local environment variables in a `.env.local` file.
4.  Start the local database container: `docker-compose up -d`
5.  Run database migrations: `npx prisma migrate dev`
6.  Start the development server: `npm run dev`

### **c. Deployment Proposal**

  - **Application:** Vercel or Netlify (for seamless, unified deployment of the Next.js app).
  - **Database:** Railway or Supabase.
  - **Suggested Domains:** `readowl.app` or `readowl.com`