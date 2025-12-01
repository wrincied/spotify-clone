# SpotifyClone — Portfolio Project

A full-stack recreation of the Spotify homepage built with **Angular 21** and a **Node.js REST API**.  
This project demonstrates real-world frontend development with modern Angular architecture, reusable components, backend integration, and production-style Git workflow.

---


# 🧑‍💻 Technical Summary

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

# 🌳 Git Workflow

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


# 📚 Additional Resources

Angular CLI documentation:  
https://angular.dev/tools/cli
