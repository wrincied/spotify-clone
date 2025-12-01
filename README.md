# SpotifyClone — Portfolio Project

A full-stack recreation of the Spotify homepage built with **Angular 21** and a **Node.js REST API**.  
This project demonstrates real-world frontend development with modern Angular architecture, reusable components, backend integration, and production-style Git workflow.

---

# ⭐ HR Overview (Non-technical)

**SpotifyClone** is a modern web application that visually and functionally recreates the Spotify homepage.

The project demonstrates:

- Ability to build complex UI layouts  
- Experience with API integration  
- Understanding of component-based architecture  
- Skills in both frontend and backend  
- Real-world Git workflow (main / dev / feature branches)  
- Work with modern frameworks and tools  

**What HR should know:**  
This project shows that I can build real applications, not just simple test tasks.

---

# 🧑‍💻 Technical Summary (for Resume / CV)

**Tech Stack:**  
- Angular 21 (standalone components, HttpClient, SCSS)  
- Node.js + Express backend  
- TypeScript  
- RxJS  
- Git (main / dev / feature workflow)

**Key Features:**  
- Full Spotify-style homepage UI  
- Reusable SongCard component  
- Dynamic playlist loading from backend  
- REST API server (albums.json)  
- Clean component-service-template structure  
- Prepared modules for search, login, and player

**Purpose:**  
Demonstrate production-level Angular architecture and full-stack app design.

---

# 📁 Project Structure

```
spotify-clone/
│
├── frontend/                     Angular application
│   ├── src/app/
│   │   ├── components/          Reusable UI components
│   │   ├── pages/               Page-level views
│   │   └── services/            API service layer
│   └── assets/
│
├── backend/                      Node.js REST API
│   ├── server.js
│   ├── albums.json
│   └── .env (ignored)
│
└── README.md
```

---

# 🌳 Git Workflow (Professional)

```
main        → production-ready code
dev         → integrated development branch
feature/*   → isolated branches for individual tasks
```

Example:

```bash
git checkout dev
git checkout -b feature/homepage
git commit -m "Build homepage UI"
git push origin feature/homepage
```

After completion:

```bash
git merge feature/homepage
```

---

# ▶ Frontend Development

Start Angular dev server:

```bash
ng serve
```

Navigate to:

```
http://localhost:4200/
```

---

# ▶ Backend Development

Start Node.js server:

```bash
node backend/server.js
```

Backend endpoint:

```
http://localhost:3000/api/albums
```

---

# 🏗 Building the Project

Build frontend:

```bash
ng build
```

Artifacts are stored in:

```
dist/
```

---

# 🧪 Tests

Run unit tests (Vitest):

```bash
ng test
```

Run e2e tests:

```bash
ng e2e
```

---

# 📌 Why This Project Matters (for Employers)

This project proves the ability to:

- Work with modern Angular architecture  
- Build scalable and reusable components  
- Connect frontend and backend  
- Structure applications the way teams do in real companies  
- Follow production Git standards  
- Develop and maintain a real product-like codebase  

This is the type of project expected from **strong juniors** and **early mid-level developers**.

---

# 📚 Additional Resources

Angular CLI documentation:  
https://angular.dev/tools/cli
